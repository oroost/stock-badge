'use strict';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'FETCH_STOCK') return;

  const ticker = msg.ticker;

  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    sendResponse(cached.data);
    return true;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;

  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(json => {
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('No data');

      const price         = meta.regularMarketPrice;
      const previousClose = meta.previousClose ?? meta.chartPreviousClose;
      const change        = price - previousClose;
      const changePercent = (change / previousClose) * 100;
      const currency      = meta.currency ?? 'USD';

      const data = { price, change, changePercent, currency, ticker };
      cache.set(ticker, { data, ts: Date.now() });
      sendResponse(data);
    })
    .catch(err => {
      fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`)
        .then(r => r.json())
        .then(json => {
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) throw new Error('No data');
          const price         = meta.regularMarketPrice;
          const previousClose = meta.previousClose ?? meta.chartPreviousClose;
          const change        = price - previousClose;
          const changePercent = (change / previousClose) * 100;
          const currency      = meta.currency ?? 'USD';
          const data = { price, change, changePercent, currency, ticker };
          cache.set(ticker, { data, ts: Date.now() });
          sendResponse(data);
        })
        .catch(() => sendResponse({ error: true }));
    });

  return true;
});
