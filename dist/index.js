#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { z } from "zod";
import fetch from "node-fetch";
import Debug from "debug";
dotenv.config();
const debug = Debug("alpaca-mcp");
async function request({ base = process.env.ALPACA_ENDPOINT, path, method = "GET", params = {} }) {
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
        throw new Error("Alpaca credentials not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY.");
    }
    const qs = new URLSearchParams(params).toString();
    const url = `${base}${path}${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, {
        method,
        headers: {
            "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
        },
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`${res.status} ${res.statusText} - ${JSON.stringify(err)}`);
    }
    return (await res.json());
}
function getBatches(arr, size) {
    const batches = [];
    for (let i = 0; i < arr.length; i += size)
        batches.push(arr.slice(i, i + size));
    return batches;
}
export { request, getBatches };
export async function getAssets({ assetClass = 'us_equity' }) {
    try {
        const data = await request({
            base: process.env.ALPACA_BROKER_ENDPOINT,
            path: "/v1/assets",
            params: { status: "active", asset_class: assetClass },
        });
        const assets = data.filter((a) => a.tradable);
        return { content: [{ type: "text", text: JSON.stringify(assets) }] };
    }
    catch (err) {
        debug("get-assets error", err);
        return { content: [{ type: "text", text: `Error fetching assets: ${err.message}` }], isError: true };
    }
}
export async function getStockBars({ symbols, start, end, timeframe }) {
    try {
        const result = { bars: {} };
        for (const batch of getBatches(symbols, 2000)) {
            let pageToken;
            do {
                const params = { timeframe, limit: 10000, start, end, symbols: batch.join(",") };
                if (pageToken)
                    params.page_token = pageToken;
                const resp = await request({
                    base: process.env.ALPACA_ENDPOINT,
                    path: "/v2/stocks/bars",
                    params,
                });
                Object.assign(result.bars, resp.bars);
                pageToken = resp.next_page_token;
            } while (pageToken);
        }
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
    catch (err) {
        debug("get-stock-bars error", err);
        return { content: [{ type: "text", text: `Error fetching stock bars: ${err.message}` }], isError: true };
    }
}
export async function getMarketDays({ start, end }) {
    try {
        const days = await request({
            base: process.env.ALPACA_ENDPOINT,
            path: "/v2/calendar",
            params: { start, end },
        });
        return { content: [{ type: "text", text: JSON.stringify(days) }] };
    }
    catch (err) {
        debug("get-market-days error", err);
        return { content: [{ type: "text", text: `Error fetching market days: ${err.message}` }], isError: true };
    }
}
export async function getNews({ start, end, symbols }) {
    try {
        const all = [];
        let pageToken;
        do {
            const params = pageToken
                ? { page_token: pageToken }
                : { sort: "desc", start, end, symbols: symbols.join(","), include_content: true };
            const resp = await request({
                base: process.env.ALPACA_ENDPOINT,
                path: "/v1beta1/news",
                params,
            });
            all.push(...resp.news);
            pageToken = resp.next_page_token;
        } while (pageToken);
        return { content: [{ type: "text", text: JSON.stringify(all) }] };
    }
    catch (err) {
        debug("get-news error", err);
        return { content: [{ type: "text", text: `Error fetching news: ${err.message}` }], isError: true };
    }
}
const server = new McpServer({
    name: "Alpaca MCP Server",
    version: "1.0.0",
    description: "Expose Alpaca API via MCP",
});
server.tool("get-assets", { assetClass: z.enum(["us_equity", "crypto"]).optional().default("us_equity") }, getAssets);
server.tool("get-stock-bars", {
    symbols: z.array(z.string()),
    start: z.string(),
    end: z.string(),
    timeframe: z.string(),
}, getStockBars);
server.tool("get-market-days", { start: z.string(), end: z.string() }, getMarketDays);
server.tool("get-news", { start: z.string(), end: z.string(), symbols: z.array(z.string()) }, getNews);
const transport = new StdioServerTransport();
await server.connect(transport);
