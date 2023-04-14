import type { PathLike } from 'node:fs';

declare module 'axios' {
    export interface AxiosInstance {
        down: (downUrl: string, pageUrl?: string | URL) => Promise<PathLike>;
    }
}
