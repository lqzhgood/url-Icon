import { promises as fs, PathLike, readdirSync } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import * as cheerio from 'cheerio';
import iconGen from 'icon-gen';

import axios from './axios.js';
import CONFIG from '../config.js';

type DownRes = null | PathLike;

const ICONS_FILE = readdirSync(CONFIG.iconDir).map(f => ({
    f: path.join(CONFIG.iconDir, f),
    n: 0,
}));

export function getURL(t: string): null | URL {
    const u = t.match(/(?<=^URL=).+$/gim);
    if (!u) return null;

    return new URL(u[0]);
}

export async function handleIconFile(
    f: PathLike,
    t: string,
    url: URL
): Promise<void> {
    const find = ICONS_FILE.find(({ f, n }) => f.includes(getHostname(url)));
    if (find) {
        // 找到相同 hostname 直接写入文件
        writeIconInfo(f, t, find.f);
        find.n++;
    } else {
        const res = await downIcon(url);
        if (res) {
            writeIconInfo(f, t, res);
        } else {
            writeIconInfo(f, t, '');
        }
    }
}

export function getHostname(u: string | URL): string {
    if (typeof u === 'string') {
        u = new URL(u);
    }
    return u.hostname.toLowerCase();
}

export async function downIcon(url: URL): Promise<DownRes> {
    let res: DownRes;
    // 下载当前页面的
    res = await downPageIcon(url);
    if (res) return res;

    // 下载主页的
    res = await downPageIcon(new URL(url.origin));
    if (res) return res;

    // 下载默认
    try {
        const fav_default = url.origin + '/favicon.ico';
        const p = await axios.down(fav_default, url);
        return p;
    } catch (error) {
        // 默认的不存在 不处理
        // console.log('error.message', error);
    }

    return null;
}

async function downPageIcon(url: URL): Promise<DownRes> {
    try {
        const html = (await axios.get(url.href)).data;
        const $ = cheerio.load(html);

        // shortcut icon 是不合规的 但是用这个可以精确匹配到 icon
        // MDN https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel#attr-icon
        let ns = Array.from($('head link[href][rel="shortcut icon" i]'));

        if (ns.length == 0) {
            ns = Array.from($('head link[href][rel="icon" i]'));
        }

        if (ns.length === 0) return null;

        let n;

        // 如果只有一个 或者 每一个标签都没有 sizes 属性 拿第一个
        if (ns.length === 1 || ns.every(n => !$(n).attr('sizes'))) {
            n = ns[0];
        } else {
            // 比较 sizes
            // MDN https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#attr-sizes

            // 不止一个， 且至少有一个有 size 属性
            ns = ns.filter(n => $(n).attr('sizes'));
            n = ns.reduce(
                (pre, n) => {
                    const sz = $(n).attr('sizes') as string; // 没有 sizes 的都被过滤掉了

                    const txt = sz.match(/(\d+)[xX](\d+)/);

                    if (txt) {
                        const w = Number(txt[1]);
                        const h = Number(txt[2]);

                        const px = w * h;
                        return px > pre.px ? { px, n } : pre;
                    } else {
                        return pre;
                    }
                },
                { px: 0, n: ns[0] }
            ).n;
        }

        const fav_url = new URL($(n).attr('href') as string, url);
        const fav_href = fav_url.href;

        const p = await axios.down(fav_href, url);
        return p;
    } catch (error) {
        return null;
    }
}
async function writeIconInfo(
    f: PathLike,
    t: string,
    iconFile: PathLike
): Promise<void> {
    const lines = t.split(/\n/);

    // IconFile
    // 好像只支持本地的 .ico 文件
    // 网络路径支持 .png
    // 最好是全部转换为 .ico
    const i = lines.findIndex(t => /^IconFile=/i.test(t));
    // 没有 iconFile
    if (!iconFile) {
        lines.splice(i, 1);
    } else {
        // !!! NOT SUPPORTED RELATIVE PATH
        // const iconPath =
        //     CONFIG.pathType === 'resolve'
        //         ? path.resolve(CONFIG.input, CONFIG.iconDir)
        //         : path.relative(CONFIG.input, CONFIG.iconDir);
        // iconFile = path.join(iconPath, path.basename(iconFile as string));

        if (i !== -1) {
            lines[i] = `IconFile=${iconFile}`;
        } else {
            lines.push(`IconFile=${iconFile}`);
        }
    }

    // IconIndex
    // .ico 必须添加 IconIndex=0
    // .png 好像是 IconIndex=1 （不确定）
    const ii = lines.findIndex(t => /^IconIndex=/i.test(t));
    if (ii !== -1) {
        lines[ii] = `IconIndex=0`;
        // 不知道 IconIndex 值的意义， 删除让程序默认处理吧
        // lines.splice(ii, 1);
    } else {
        lines.push(`IconIndex=0`);
    }

    // 结尾添加一个空行
    const text = lines
        .filter(v => v)
        .concat([''])
        .join('\n');

    await fs.writeFile(f, text, 'utf-8');
}

export async function clear(): Promise<void> {
    const delArr = ICONS_FILE.filter(({ n }) => n === 0).map(({ f }) => f);
    for (let i = 0; i < delArr.length; i++) {
        const f = delArr[i];
        await fs.unlink(f);
    }
}

export async function conversionIco(f: string): Promise<boolean> {
    const { dir, name } = path.parse(f);
    await (iconGen as any)(f, dir, {
        report: false,
        ico: { name: name, sizes: [64] },
    });
    await fs.unlink(f);
    return true;
}
