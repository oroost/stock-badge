'use strict';

(function () {
  if (document.getElementById('stock-badge-ext')) return;

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');

  let ticker = DOMAIN_TICKERS[hostname];
  if (!ticker) {
    const parts = hostname.split('.');
    if (parts.length > 2) ticker = DOMAIN_TICKERS[parts.slice(-2).join('.')];
  }
  if (!ticker || ticker === 'N/A') return;

  const badge = document.createElement('div');
  badge.id = 'stock-badge-ext';
  badge.innerHTML = `
    <button id="stock-badge-close" title="Close">✕</button>
    <div id="stock-badge-sym">${ticker}</div>
    <div id="stock-badge-price">—</div>
    <div id="stock-badge-change"></div>
  `;
  document.body.appendChild(badge);

  document.getElementById('stock-badge-close').addEventListener('click', () => badge.remove());

  chrome.runtime.sendMessage({ type: 'FETCH_STOCK', ticker }, (data) => {
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
})();
