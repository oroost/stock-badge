'use strict';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const EXCHANGE_HOURS = {
  'SW': { tz: 'Europe/Zurich',     open: [9,0],  close: [17,30] },
  'DE': { tz: 'Europe/Berlin',     open: [9,0],  close: [17,30] },
  'PA': { tz: 'Europe/Paris',      open: [9,0],  close: [17,30] },
  'AS': { tz: 'Europe/Amsterdam',  open: [9,0],  close: [17,30] },
  'MI': { tz: 'Europe/Rome',       open: [9,0],  close: [17,30] },
  'MC': { tz: 'Europe/Madrid',     open: [9,0],  close: [17,30] },
  'L' : { tz: 'Europe/London',     open: [8,0],  close: [16,30] },
  'T' : { tz: 'Asia/Tokyo',        open: [9,0],  close: [15,30] },
  'HK': { tz: 'Asia/Hong_Kong',    open: [9,30], close: [16,0]  },
  'US': { tz: 'America/New_York',  open: [9,30], close: [16,0]  },
};

function computeMarketState(ticker) {
  const now = new Date();
  const dow = now.getUTCDay();
  if (dow === 0 || dow === 6) return 'CLOSED';

  const suffix = ticker.includes('.') ? ticker.split('.').pop().toUpperCase() : 'US';
  const ex = EXCHANGE_HOURS[suffix] || EXCHANGE_HOURS['US'];

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ex.tz, hour: 'numeric', minute: 'numeric', hour12: false
  });
  const parts = fmt.formatToParts(now);
  const h = parseInt(parts.find(p => p.type === 'hour').value);
  const m = parseInt(parts.find(p => p.type === 'minute').value);
  const cur  = h * 60 + m;
  const open = ex.open[0]  * 60 + ex.open[1];
  const cls  = ex.close[0] * 60 + ex.close[1];

  if (cur >= open && cur < cls) return 'REGULAR';
  if (cur >= open - 90 && cur < open) return 'PRE';
  if (cur >= cls && cur < cls + 120) return 'POST';
  return 'CLOSED';
}

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
  const marketState = computeMarketState(ticker);
  return { price, change, changePercent, currency, ticker, marketState };
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
