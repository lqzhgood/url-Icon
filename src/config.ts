interface IConfig {
    readonly input: string;
    readonly iconDir: string;
    readonly pathType?: string;
}

import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [inputDir, iconDir, pathType] = process.argv.splice(2);

interface IConfig {
    readonly input: string;
    readonly iconDir: string;
    readonly pathType?: string;
}

const config: IConfig = {
    input: inputDir ? path.resolve(inputDir) : path.join(__dirname, '../input'),
    iconDir: iconDir ? path.resolve(iconDir) : path.join(__dirname, '../icons'),
    // input: path.resolve('D:\\My_Cloud\\Other\\IE'),
    // iconDir: path.resolve('D:\\My_Cloud\\Other\\IE_icons'),
};

if (!fs.existsSync(config.iconDir)) {
    fs.mkdirSync(config.iconDir);
}

export default config;
