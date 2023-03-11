import fs from 'node:fs/promises';
import path from 'path';
import CONFIG from '../config.js';
import axiosBase from 'axios';
import { conversionIco, getHostname } from './index.js';
const axios = axiosBase.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/82.0.4075.0 Safari/537.36',
    },
    timeout: 10 * 1000,
});
// icon 可能和页面不在同域下
axios.down = async function (url, pageUrl) {
    pageUrl = pageUrl || new URL(url);
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    if (resp.data.length === 0)
        throw new Error('下载内容为空');
    // 不知道 body 出现的位置 所以需要全部字符串解码
    const str = new TextDecoder().decode(resp.data);
    if (/<body>/gim.test(str))
        throw new Error('下载的文件是 html');
    const u = new URL(url);
    let ext = path.extname(u.pathname).toLowerCase();
    if (resp.headers['content-type'].includes('icon')) {
        ext = '.ico';
    }
    const target = path.join(CONFIG.iconDir, `${getHostname(pageUrl)}${ext}`);
    await fs.writeFile(target, resp.data);
    if (['.jpg', '.png', '.svg'].includes(ext)) {
        await conversionIco(target);
        return target.replace(/\.[^/.]+$/, '.ico');
    }
    return target;
};
export default axios;
