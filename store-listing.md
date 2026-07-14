# Stock Badge — Chrome Web Store Listing

---

## Extension Name
Stock Badge

## Category
Productivity  *(or Finance if available)*

## Language
English

---

## Short Description
*(max 132 characters)*

> See the live stock price & earnings countdown for any company website you visit — automatically, no search needed.

---

## Full Description

**Stock Badge** shows a live stock price badge whenever you visit a company's website — zero searching, zero switching tabs.

### How it works
Visit any supported company website and a small badge appears in the corner showing:
- **Live stock price** and percentage change
- **Market status dot** — green (open), orange (pre/after-hours), grey (closed)
- **Earnings countdown** — days until next earnings report + historical beat/miss record

### Features
✅ **Automatic detection** — covers 300+ companies across the US, Europe, and Asia  
✅ **Multiple timeframes** — 1D · 1W · 1M · 3M · 1Y  
✅ **Copy ticker** — one click copies the symbol to your clipboard  
✅ **Draggable badge** — reposition it anywhere on the page  
✅ **Mini pill mode** — collapses to a tiny indicator after first visit  
✅ **Earnings Countdown** *(optional)* — shows next earnings date and whether the company has a history of beating analyst expectations  
✅ **Add any company** — custom domain → ticker mapping via the popup  
✅ **Works globally** — NYSE, NASDAQ, SIX, XETRA, Euronext, LSE, TSE, HKEX  

### Privacy
No accounts. No tracking. No data sent anywhere. Stock prices are fetched directly from Yahoo Finance. Your settings stay on your device.

---

## Screenshots needed (1280×800 or 640×400)

Suggested shots:
1. Badge on google.com showing GOOGL price + earnings row
2. Badge on tesla.com with 1W timeframe + pulsing big-move border
3. Popup open showing timeframe selector + Earnings Countdown toggle
4. Mini pill collapsed in corner of a news article
5. Badge on a European company (e.g. nestle.com) showing CHF price

---

## Privacy Policy (required — paste this into a GitHub Gist or simple page)

**Stock Badge Privacy Policy**

Stock Badge does not collect, store, or transmit any personal data.

- Stock prices are fetched in real time directly from Yahoo Finance's public API.
- Your settings (timeframe preference, custom tickers) are stored locally in Chrome's sync storage and never leave your browser.
- No analytics, no tracking scripts, no third-party services.

---

## ZIP instructions

Run this in the terminal from the parent folder:

```bash
zip -r stock-badge-v1.0.zip stock-badge/ \
  --exclude "stock-badge/.git/*" \
  --exclude "stock-badge/generate-icons.html" \
  --exclude "stock-badge/store-listing.md" \
  --exclude "stock-badge/*.DS_Store"
```

Upload `stock-badge-v1.0.zip` on the Chrome Web Store Developer Dashboard.
