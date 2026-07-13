'use strict';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const TF_CONFIG = {
  '1D': { range: '2d',  interval: '1d'  },
  '1W': { range: '5d',  interval: '1d'  },
  '1M': { range: '1mo', interval: '1d'  },
  '3M': { range: '3mo', interval: '1d'  },
  '1Y': { range: '1y',  interval: '1wk' },
};

function parseData(json, tf, ticker) {
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const meta     = result.meta;
  const price    = meta.regularMarketPrice;
  const currency = meta.currency ?? 'USD';

  let startPrice;
  if (tf === '1D') {
    startPrice = meta.previousClose ?? meta.chartPreviousClose;
  } else {
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    startPrice = closes.find(c => c != null);
  }
  if (!startPrice) throw new Error('No start price');

  const change        = price - startPrice;
  const changePercent = (change / startPrice) * 100;
  return { price, change, changePercent, currency, ticker };
}

function buildUrl(ticker, tf, host = 'query1') {
  const { range, interval } = TF_CONFIG[tf] ?? TF_CONFIG['1D'];
  return `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'FETCH_STOCK') return;

  const ticker = msg.ticker;
  const tf     = msg.timeframe || '1D';
  const key    = `${ticker}:${tf}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    sendResponse(cached.data);
    return true;
  }

  fetch(buildUrl(ticker, tf, 'query1'))
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(json => {
      const data = parseData(json, tf, ticker);
      cache.set(key, { data, ts: Date.now() });
      sendResponse(data);
    })
    .catch(() => {
      fetch(buildUrl(ticker, tf, 'query2'))
        .then(r => r.json())
        .then(json => {
          const data = parseData(json, tf, ticker);
          cache.set(key, { data, ts: Date.now() });
          sendResponse(data);
        })
        .catch(() => sendResponse({ error: true }));
    });

  return true;
});
