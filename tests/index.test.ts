import { describe, it, expect, vi, beforeEach } from 'vitest';
import fetch from 'node-fetch';
import { request, getBatches, getAssets, getStockBars, getMarketDays, getNews } from '../index';

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

describe('getBatches', () => {
  it('splits array into batches of given size', () => {
    expect(getBatches([1,2,3,4,5], 2)).toEqual([[1,2], [3,4], [5]]);
    expect(getBatches([], 3)).toEqual([]);
    expect(getBatches([1], 1)).toEqual([[1]]);
  });
});

describe('request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ALPACA_API_KEY;
    delete process.env.ALPACA_SECRET_KEY;
    delete process.env.ALPACA_ENDPOINT;
  });

  it('throws if API keys are missing', async () => {
    await expect(request({ path: '/test' })).rejects.toThrow(
      'Alpaca credentials not configured'
    );
  });

  it('performs a successful GET request', async () => {
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_ENDPOINT = 'https://api/';
    const mockRes = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ foo: 'bar' }),
    };
    (fetch as any).mockResolvedValue(mockRes);

    const res = await request<{ foo: string }>({ path: '/endpoint' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api//endpoint',
      { method: 'GET', headers: { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' } }
    );
    expect(res).toEqual({ foo: 'bar' });
  });

  it('throws with status and error body on failure', async () => {
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_ENDPOINT = 'https://api/';
    const errorBody = { error: 'fail' };
    const mockRes = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => errorBody,
    };
    (fetch as any).mockResolvedValue(mockRes);
    await expect(request({ path: '/e' })).rejects.toThrow(
      '404 Not Found - {"error":"fail"}'
    );
  });
});

describe('getAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_BROKER_ENDPOINT = 'https://broker/';
  });

  it('fetches tradable assets', async () => {
    const data = [
      { tradable: true, symbol: 'A' },
      { tradable: false, symbol: 'B' },
    ];
    const mockRes = { ok: true, status: 200, statusText: 'OK', json: async () => data };
    (fetch as any).mockResolvedValue(mockRes);

    const res = await getAssets({ assetClass: 'us_equity' });
    expect(fetch).toHaveBeenCalledWith(
      'https://broker//v1/assets?status=active&asset_class=us_equity',
      { method: 'GET', headers: { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' } }
    );
    const expected = data.filter(a => a.tradable);
    expect(JSON.parse(res.content[0].text)).toEqual(expected);
  });

  it('returns an error on fetch failure', async () => {
    const mockRes = { ok: false, status: 500, statusText: 'Error', json: async () => ({ message: 'fail' }) };
    (fetch as any).mockResolvedValue(mockRes);

    const res = await getAssets({});
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Error fetching assets:');
  });
});

describe('getStockBars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_ENDPOINT = 'https://api/';
  });

  it('fetches stock bars and returns aggregated bars', async () => {
    const apiResponse = { bars: { A: { value: 1 }, B: { value: 2 } } };
    const mockRes = { ok: true, status: 200, statusText: 'OK', json: async () => apiResponse };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getStockBars({
      symbols: ['A', 'B'],
      start: '2021-01-01',
      end: '2021-01-02',
      timeframe: '1Day',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://api//v2/stocks/bars?timeframe=1Day&limit=10000&start=2021-01-01&end=2021-01-02&symbols=A%2CB',
      { method: 'GET', headers: { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' } }
    );
    expect(JSON.parse(res.content[0].text)).toEqual({ bars: apiResponse.bars });
  });

  it('returns an error on fetch failure', async () => {
    const mockRes = { ok: false, status: 500, statusText: 'Error', json: async () => ({ message: 'fail' }) };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getStockBars({
      symbols: ['A'],
      start: '2021-01-01',
      end: '2021-01-02',
      timeframe: '1Day',
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Error fetching stock bars:');
  });
});

describe('getMarketDays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_ENDPOINT = 'https://api/';
  });

  it('fetches market days', async () => {
    const days = [{ date: '2021-01-01' }, { date: '2021-01-02' }];
    const mockRes = { ok: true, status: 200, statusText: 'OK', json: async () => days };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getMarketDays({ start: '2021-01-01', end: '2021-01-02' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api//v2/calendar?start=2021-01-01&end=2021-01-02',
      { method: 'GET', headers: { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' } }
    );
    expect(JSON.parse(res.content[0].text)).toEqual(days);
  });

  it('returns an error on fetch failure', async () => {
    const mockRes = { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ error: 'not found' }) };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getMarketDays({ start: '2021-01-01', end: '2021-01-02' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Error fetching market days:');
  });
});

describe('getNews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALPACA_API_KEY = 'key';
    process.env.ALPACA_SECRET_KEY = 'secret';
    process.env.ALPACA_ENDPOINT = 'https://api/';
  });

  it('fetches news articles', async () => {
    const news = [{ id: 1 }, { id: 2 }];
    const mockRes = { ok: true, status: 200, statusText: 'OK', json: async () => ({ news }) };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getNews({ start: '2021-01-01', end: '2021-01-02', symbols: ['A', 'B'] });
    expect(fetch).toHaveBeenCalledWith(
      'https://api//v1beta1/news?sort=desc&start=2021-01-01&end=2021-01-02&symbols=A%2CB&include_content=true',
      { method: 'GET', headers: { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' } }
    );
    expect(JSON.parse(res.content[0].text)).toEqual(news);
  });

  it('returns an error on fetch failure', async () => {
    const mockRes = { ok: false, status: 500, statusText: 'Error', json: async () => ({ message: 'fail' }) };
    (fetch as any).mockResolvedValue(mockRes);
    const res = await getNews({ start: '2021-01-01', end: '2021-01-02', symbols: ['A'] });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Error fetching news:');
  });
});
