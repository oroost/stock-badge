'use strict';

const tfButtons  = document.querySelectorAll('.tf-btn');

function setActiveTf(tf) {
  tfButtons.forEach(b => b.classList.toggle('active', b.dataset.tf === tf));
}

tfButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tf = btn.dataset.tf;
    chrome.storage.sync.set({ timeframe: tf });
    setActiveTf(tf);
  });
});

const inpDomain = document.getElementById('inp-domain');
const inpTicker = document.getElementById('inp-ticker');
const btnAdd    = document.getElementById('btn-add');
const msg       = document.getElementById('msg');
const list      = document.getElementById('custom-list');
const emptyHint = document.getElementById('empty-hint');

function showMsg(text, type) {
  msg.textContent = text;
  msg.className = 'msg ' + type;
  setTimeout(() => { msg.textContent = ''; msg.className = 'msg'; }, 2500);
}

function renderList(custom) {
  list.innerHTML = '';
  const entries = Object.entries(custom);
  emptyHint.style.display = entries.length ? 'none' : 'block';

  entries.forEach(([domain, ticker]) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-info">
        <span class="entry-domain">${domain}</span>
        <span class="entry-ticker">${ticker}</span>
      </div>
      <button class="btn-del" data-domain="${domain}" title="Remove">✕</button>
    `;
    li.querySelector('.btn-del').addEventListener('click', () => remove(domain));
    list.appendChild(li);
  });
}

function add() {
  const domain = inpDomain.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const ticker = inpTicker.value.trim().toUpperCase();

  if (!domain) return showMsg('Enter a domain.', 'error');
  if (!ticker) return showMsg('Enter a ticker symbol.', 'error');
  if (!/^[A-Z0-9.\-^=]+$/.test(ticker)) return showMsg('Invalid ticker format.', 'error');

  chrome.storage.sync.get(['customTickers'], (data) => {
    const custom = data.customTickers || {};
    custom[domain] = ticker;
    chrome.storage.sync.set({ customTickers: custom }, () => {
      inpDomain.value = '';
      inpTicker.value = '';
      showMsg(`${domain} → ${ticker} added!`, 'success');
      renderList(custom);
    });
  });
}

function remove(domain) {
  chrome.storage.sync.get(['customTickers'], (data) => {
    const custom = data.customTickers || {};
    delete custom[domain];
    chrome.storage.sync.set({ customTickers: custom }, () => renderList(custom));
  });
}

btnAdd.addEventListener('click', add);
inpTicker.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

function load() {
  chrome.storage.sync.get(['customTickers', 'timeframe'], (data) => {
    renderList(data.customTickers || {});
    setActiveTf(data.timeframe || '1D');
  });
}

load();
