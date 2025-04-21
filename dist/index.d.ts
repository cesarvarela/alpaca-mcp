#!/usr/bin/env node
interface RequestOptions {
    base?: string;
    path: string;
    method?: string;
    params?: Record<string, unknown>;
}
declare function request<T>({ base, path, method, params }: RequestOptions): Promise<T>;
declare function getBatches<T>(arr: T[], size: number): T[][];
export { request, getBatches };
export declare function getAssets({ assetClass }: {
    assetClass?: 'us_equity' | 'crypto';
}): Promise<{
    content: any;
    isError?: undefined;
} | {
    content: any;
    isError: boolean;
}>;
export declare function getStockBars({ symbols, start, end, timeframe }: {
    symbols: string[];
    start: string;
    end: string;
    timeframe: string;
}): Promise<{
    content: any;
    isError?: undefined;
} | {
    content: any;
    isError: boolean;
}>;
export declare function getMarketDays({ start, end }: {
    start: string;
    end: string;
}): Promise<{
    content: any;
    isError?: undefined;
} | {
    content: any;
    isError: boolean;
}>;
export declare function getNews({ start, end, symbols }: {
    start: string;
    end: string;
    symbols: string[];
}): Promise<{
    content: any;
    isError?: undefined;
} | {
    content: any;
    isError: boolean;
}>;
