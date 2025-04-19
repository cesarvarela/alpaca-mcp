# Alpaca MCP Server

Expose Alpaca Market Data & Broker API as MCP tools.

## Installation

```bash
npm install alpaca-mcp
```

## Local Development

```bash
git clone <repo-url>
cd alpaca-mcp
npm install
```

## Environment Variables

Create a `.env` at project root with:

```env
ALPACA_ENDPOINT=https://data.alpaca.markets
ALPACA_BROKER_ENDPOINT=https://broker-api.alpaca.markets
ALPACA_API_KEY=YOUR_ALPACA_API_KEY
ALPACA_SECRET_KEY=YOUR_ALPACA_SECRET_KEY
```

## Commands

- **start** (dev): `npm start` (runs `npx tsx index.ts`)
- **build**: `npm run build` (compiles to `dist/`)
- **run compiled**: `node dist/index.js`

## Usage

Once running, the MCP server listens on stdin/stdout. Use any MCP client or the CLI:

```bash
npm link      # optional
alpaca-mcp    # starts server globally
```

### Available Tools

- **get-assets** `{ assetClass?: "us_equity" | "crypto" }`
- **get-stock-bars** `{ symbols: string[]; start: string; end: string; timeframe: string }`
- **get-market-days** `{ start: string; end: string }`
- **get-news** `{ start: string; end: string; symbols: string[] }`

Each returns JSON in `content[0].text` or an error.

## MCP Client Configuration

To integrate via `mcp.config.json`, add the following under the `mcpServers` key:

```json
{
  "mcpServers": {
    "alpaca-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "alpaca-mcp"
      ],
      "env": {
        "ALPACA_ENDPOINT": "https://data.alpaca.markets",
        "ALPACA_BROKER_ENDPOINT": "https://broker-api.alpaca.markets",
        "ALPACA_API_KEY": "<YOUR_API_KEY>",
        "ALPACA_SECRET_KEY": "<YOUR_SECRET_KEY>"
      }
    }
  }
}

## Publishing

```bash
npm publish
```

## License

ISC
