import { PathLike } from 'fs';

declare type DownRes = null | PathLike;

declare interface IConfig {
    readonly input: string;
    readonly iconDir: string;
}
