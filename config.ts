import { IConfig } from './types/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: IConfig = {
    input: path.join(__dirname, 'input'),
    iconDir: path.join(__dirname, 'icons'),
    // input: path.resolve('D:\\My_Cloud\\Other\\IE'),
    // iconDir: path.resolve('D:\\My_Cloud\\Other\\IE_icons'),
};

export default config;
