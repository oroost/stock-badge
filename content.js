'use strict';

(function () {
  if (document.getElementById('stock-badge-ext') || document.getElementById('stock-badge-mini')) return;

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');
  const rootDomain = hostname.split('.').slice(-2).join('.');

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

    const sessionKey    = 'sbShown_' + rootDomain;
    const dismissedKey  = 'sbDismissed_' + rootDomain;
    if (sessionStorage.getItem(dismissedKey)) return;
    const isFirstVisit = !sessionStorage.getItem(sessionKey);

    const cachedRaw = sessionStorage.getItem(`sbData_${ticker}_${timeframe}`);
    const cachedData = cachedRaw ? JSON.parse(cachedRaw) : null;

    if (isFirstVisit) {
      sessionStorage.setItem(sessionKey, '1');
      showBadge(ticker, timeframe);
    } else {
      showMini(ticker, timeframe, cachedData, () => showBadge(ticker, timeframe));
    }
  });

  function showMini(ticker, timeframe, stockData, onExpand) {
    if (document.getElementById('stock-badge-mini')) return;
    const mini = document.createElement('div');
    mini.id = 'stock-badge-mini';

    if (stockData) {
      const sign = stockData.change >= 0 ? '+' : '';
      mini.textContent = `${ticker}  ${sign}${stockData.changePercent.toFixed(2)}%`;
      if (stockData.change > 0) mini.classList.add('up');
      else if (stockData.change < 0) mini.classList.add('down');
      else mini.classList.add('flat');
    } else {
      mini.textContent = `${ticker} 📈`;
    }

    const closeBtn = document.createElement('span');
    closeBtn.id = 'stock-badge-mini-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sessionStorage.setItem('sbDismissed_' + rootDomain, '1');
      mini.remove();
    });
    mini.appendChild(closeBtn);

    mini.addEventListener('click', () => { mini.remove(); onExpand(); });
    document.body.appendChild(mini);
  }

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

    function closeBadge() {
      badge.remove();
      const cachedRaw = sessionStorage.getItem(`sbData_${ticker}_${timeframe}`);
      const cachedData = cachedRaw ? JSON.parse(cachedRaw) : null;
      showMini(ticker, timeframe, cachedData, () => showBadge(ticker, timeframe));
    }

    document.getElementById('stock-badge-close').addEventListener('click', closeBadge);

    let autoClose = setTimeout(closeBadge, 5000);
    badge.addEventListener('mouseenter', () => clearTimeout(autoClose));
    badge.addEventListener('mouseleave', () => { autoClose = setTimeout(closeBadge, 5000); });

    chrome.runtime.sendMessage({ type: 'FETCH_STOCK', ticker, timeframe }, (stockData) => {
      if (chrome.runtime.lastError || !stockData || stockData.error) {
        badge.remove();
        return;
      }

      sessionStorage.setItem(`sbData_${ticker}_${timeframe}`, JSON.stringify(stockData));

      const { price, change, changePercent, currency } = stockData;
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
