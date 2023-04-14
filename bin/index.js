#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getURL, handleIconFile, clear } from './lib/index.js';
import CONFIG from './config.js';
(async () => {
    const files = (await fs.readdir(CONFIG.input)).filter(f => path.extname(f).toLowerCase() === '.url');
    const P = [];
    for (let i = 0; i < files.length; i++) {
        const f = path.join(CONFIG.input, files[i]);
        const text = await fs.readFile(f, 'utf-8');
        const url = getURL(text);
        if (!url)
            continue;
        P.push(handleIconFile(f, text, url));
    }
    // 并行
    while (P.length != 0) {
        const cut = P.splice(0, 30);
        await Promise.all(cut);
    }
    await clear();
    console.log('ok');
})();
