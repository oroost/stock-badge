'use strict';

(function () {
  if (document.getElementById('stock-badge-ext')) return;

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');

  function findTicker(allTickers) {
    let t = allTickers[hostname];
    if (!t) {
      const parts = hostname.split('.');
      if (parts.length > 2) t = allTickers[parts.slice(-2).join('.')];
    }
    return t;
  }

  chrome.storage.sync.get(['customTickers', 'timeframe'], (data) => {
    const allTickers = Object.assign({}, DOMAIN_TICKERS, data.customTickers || {});
    const ticker = findTicker(allTickers);
    const timeframe = data.timeframe || '1D';
    if (!ticker || ticker === 'N/A') return;
    showBadge(ticker, timeframe);
  });

  function showBadge(ticker, timeframe) {

  const badge = document.createElement('div');
  badge.id = 'stock-badge-ext';
  badge.innerHTML = `
    <button id="stock-badge-close" title="Close">✕</button>
    <div id="stock-badge-sym">${ticker} <span id="stock-badge-tf">${timeframe}</span></div>
    <div id="stock-badge-price">—</div>
    <div id="stock-badge-change"></div>
  `;
  document.body.appendChild(badge);

  document.getElementById('stock-badge-close').addEventListener('click', () => badge.remove());

  let autoClose = setTimeout(() => badge.remove(), 5000);
  badge.addEventListener('mouseenter', () => clearTimeout(autoClose));
  badge.addEventListener('mouseleave', () => { autoClose = setTimeout(() => badge.remove(), 5000); });

  chrome.runtime.sendMessage({ type: 'FETCH_STOCK', ticker, timeframe }, (data) => {
    if (chrome.runtime.lastError || !data || data.error) {
      badge.remove();
      return;
    }

    const { price, change, changePercent, currency } = data;

    const symbols = { USD: '$', EUR: '€', GBP: '£', CHF: 'Fr.' };
    const sym = symbols[currency] || '';
    const sign = change >= 0 ? '+' : '';

    document.getElementById('stock-badge-price').textContent =
      `${sym}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stock-badge-change').textContent =
      `${sign}${changePercent.toFixed(2)}%`;

    if (change > 0) badge.classList.add('up');
    else if (change < 0) badge.classList.add('down');
    else badge.classList.add('flat');
  });
  }
})();
