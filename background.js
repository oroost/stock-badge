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

const earningsCache = new Map();
const EARNINGS_TTL  = 12 * 60 * 60 * 1000;

async function fetchEarningsData(ticker) {
  const key = `earnings:${ticker}`;
  const cached = earningsCache.get(key);
  if (cached && Date.now() - cached.ts < EARNINGS_TTL) return cached.data;

  let daysUntil = null;
  let beats = 0, total = 0;

  // ── 1. quoteSummary: calendarEvents (next date) + earningsHistory (beat/miss) ──
  for (const host of ['query1', 'query2']) {
    try {
      const url = `https://${host}.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=calendarEvents%2CearningsHistory`;
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const json = await r.json();
      const result = json?.quoteSummary?.result?.[0];
      if (!result) throw new Error();

      // Next earnings date
      const dates = result?.calendarEvents?.earnings?.earningsDate ?? [];
      if (dates.length > 0) {
        const ts = dates[0].raw;
        const next = new Date(ts * 1000);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        daysUntil = Math.ceil((next - today) / 86400000);
      }

      // Beat/miss history
      const history = result?.earningsHistory?.history ?? [];
      for (const q of history.slice(-10)) {
        if (q.epsActual?.raw !== undefined && q.epsEstimate?.raw !== undefined) {
          total++;
          if (q.epsActual.raw >= q.epsEstimate.raw) beats++;
        }
      }
      break;
    } catch (_) {}
  }

  // ── 2. Fallback: v7/quote for date + chart events for beat/miss ──
  if (daysUntil === null) {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`);
      const json = await r.json();
      const q = json?.quoteResponse?.result?.[0];
      const ts = q?.earningsTimestampStart ?? q?.earningsTimestamp;
      if (ts) {
        const next = new Date(ts * 1000);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        daysUntil = Math.ceil((next - today) / 86400000);
      }
    } catch (_) {}
  }

  if (total === 0) {
    for (const host of ['query1', 'query2']) {
      try {
        const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2y&events=earnings`;
        const r = await fetch(url);
        const json = await r.json();
        const events = json?.chart?.result?.[0]?.events?.earnings ?? {};
        for (const e of Object.values(events)) {
          if (e.epsActual !== undefined && e.epsEstimate !== undefined) {
            total++;
            if (e.epsActual >= e.epsEstimate) beats++;
          }
        }
        if (total > 0) break;
      } catch (_) {}
    }
  }

  const data = { daysUntil, beats, total };
  earningsCache.set(key, { data, ts: Date.now() });
  return data;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_EARNINGS') {
    fetchEarningsData(msg.ticker)
      .then(sendResponse)
      .catch(() => sendResponse({ error: true }));
    return true;
  }
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
