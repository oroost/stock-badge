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

    const sessionKey   = 'sbShown_' + rootDomain;
    const dismissedKey = 'sbDismissed_' + rootDomain;

    try {
      const refHost = document.referrer ? new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '') : '';
      const refRoot = refHost.split('.').slice(-2).join('.');
      if (refRoot !== rootDomain) {
        sessionStorage.removeItem(sessionKey);
        sessionStorage.removeItem(dismissedKey);
      }
    } catch (_) {}

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

  function makeDraggable(el) {
    const saved = JSON.parse(localStorage.getItem('sbPosition') || 'null');
    if (saved) {
      el.style.setProperty('bottom', 'auto', 'important');
      el.style.setProperty('right',  'auto', 'important');
      el.style.setProperty('top',  saved.top  + 'px', 'important');
      el.style.setProperty('left', saved.left + 'px', 'important');
    }

    let pending = false, dragging = false, ox, oy, startTop, startLeft;

    el.addEventListener('mousedown', (e) => {
      const t = e.target;
      if (t.id === 'stock-badge-close' || t.id === 'stock-badge-mini-close' || t.id === 'stock-badge-copy') return;
      pending = true;
      const r = el.getBoundingClientRect();
      startTop = r.top; startLeft = r.left;
      ox = e.clientX; oy = e.clientY;
    });
    document.addEventListener('mousemove', (e) => {
      if (!pending && !dragging) return;
      if (!dragging && Math.hypot(e.clientX - ox, e.clientY - oy) > 4) {
        dragging = true;
        el.style.setProperty('bottom', 'auto', 'important');
        el.style.setProperty('right',  'auto', 'important');
        el.style.setProperty('top',  startTop  + 'px', 'important');
        el.style.setProperty('left', startLeft + 'px', 'important');
        el.style.setProperty('cursor', 'grabbing', 'important');
      }
      if (dragging) {
        el.style.setProperty('top',  (startTop  + e.clientY - oy) + 'px', 'important');
        el.style.setProperty('left', (startLeft + e.clientX - ox) + 'px', 'important');
        e.preventDefault();
      }
    });
    document.addEventListener('mouseup', (e) => {
      pending = false;
      if (!dragging) return;
      dragging = false;
      el.style.setProperty('cursor', '', 'important');
      const r = el.getBoundingClientRect();
      localStorage.setItem('sbPosition', JSON.stringify({ top: r.top, left: r.left }));
      el.addEventListener('click', e => e.stopPropagation(), { once: true });
    });
  }

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
    makeDraggable(mini);
  }

  function showBadge(ticker, timeframe) {
    const badge = document.createElement('div');
    badge.id = 'stock-badge-ext';
    badge.innerHTML = `
      <button id="stock-badge-close" title="Close">✕</button>
      <div id="stock-badge-sym">
        ${ticker} <span id="stock-badge-tf">${timeframe}</span>
        <button id="stock-badge-copy" title="Copy ticker">⎘</button>
      </div>
      <div id="stock-badge-price">—</div>
      <div id="stock-badge-change"></div>
    `;

    document.getElementById('stock-badge-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(ticker).then(() => {
        const btn = document.getElementById('stock-badge-copy');
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '⎘'; }, 1500);
      });
    });
    document.body.appendChild(badge);
    makeDraggable(badge);

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

      const { price, change, changePercent, currency, marketState } = stockData;
      const symbols = { USD: '$', EUR: '€', GBP: '£', CHF: 'Fr.' };
      const sym = symbols[currency] || '';
      const sign = change >= 0 ? '+' : '';

      const dotClass = marketState === 'REGULAR' ? 'dot-open'
                     : (marketState === 'PRE' || marketState === 'POST') ? 'dot-extended'
                     : 'dot-closed';

      document.getElementById('stock-badge-price').textContent =
        `${sym}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('stock-badge-change').innerHTML =
        `<span id="stock-badge-dot" class="${dotClass}"></span>${sign}${changePercent.toFixed(2)}%`;

      if (change > 0) badge.classList.add('up');
      else if (change < 0) badge.classList.add('down');
      else badge.classList.add('flat');

      if (timeframe === '1D' && Math.abs(changePercent) >= 3) badge.classList.add('big-move');
    });
  }
})();
