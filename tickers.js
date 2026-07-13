'use strict';

const DOMAIN_TICKERS = {
  // US Tech
  'apple.com':          'AAPL',
  'microsoft.com':      'MSFT',
  'amazon.com':         'AMZN',
  'google.com':         'GOOGL',
  'alphabet.com':       'GOOGL',
  'meta.com':           'META',
  'facebook.com':       'META',
  'instagram.com':      'META',
  'netflix.com':        'NFLX',
  'tesla.com':          'TSLA',
  'nvidia.com':         'NVDA',
  'intel.com':          'INTC',
  'amd.com':            'AMD',
  'qualcomm.com':       'QCOM',
  'adobe.com':          'ADBE',
  'salesforce.com':     'CRM',
  'oracle.com':         'ORCL',
  'ibm.com':            'IBM',
  'cisco.com':          'CSCO',
  'spotify.com':        'SPOT',
  'uber.com':           'UBER',
  'lyft.com':           'LYFT',
  'airbnb.com':         'ABNB',
  'coinbase.com':       'COIN',
  'paypal.com':         'PYPL',
  'shopify.com':        'SHOP',
  'zoom.us':            'ZM',
  'snap.com':           'SNAP',
  'dropbox.com':        'DBX',
  'cloudflare.com':     'NET',
  'datadog.com':        'DDOG',
  'snowflake.com':      'SNOW',
  'palantir.com':       'PLTR',
  'roblox.com':         'RBLX',
  'robinhood.com':      'HOOD',
  'twilio.com':         'TWLO',
  'servicenow.com':     'NOW',
  'workday.com':        'WDAY',
  'intuit.com':         'INTU',

  // Finance
  'visa.com':           'V',
  'mastercard.com':     'MA',
  'jpmorgan.com':       'JPM',
  'chase.com':          'JPM',
  'goldmansachs.com':   'GS',
  'morganstanley.com':  'MS',
  'bankofamerica.com':  'BAC',
  'wellsfargo.com':     'WFC',
  'blackrock.com':      'BLK',
  'americanexpress.com':'AXP',
  'schwab.com':         'SCHW',

  // Consumer / Retail
  'walmart.com':        'WMT',
  'target.com':         'TGT',
  'costco.com':         'COST',
  'homedepot.com':      'HD',
  'mcdonalds.com':      'MCD',
  'starbucks.com':      'SBUX',
  'cocacola.com':       'KO',
  'coca-cola.com':      'KO',
  'pepsi.com':          'PEP',
  'pepsico.com':        'PEP',
  'nike.com':           'NKE',
  'adidas.com':         'ADDYY',
  'ikea.com':           'N/A',
  'zara.com':           'ITX.MC',
  'lvmh.com':           'LVMUY',

  // Media / Telecom
  'disney.com':         'DIS',
  'comcast.com':        'CMCSA',
  'att.com':            'T',
  't-mobile.com':       'TMUS',
  'verizon.com':        'VZ',
  'spotify.com':        'SPOT',

  // Industrial / Energy
  'boeing.com':         'BA',
  'ge.com':             'GE',
  'exxonmobil.com':     'XOM',
  'chevron.com':        'CVX',

  // Healthcare / Pharma
  'pfizer.com':         'PFE',
  'abbvie.com':         'ABBV',
  'merck.com':          'MRK',
  'lilly.com':          'LLY',
  'modernatx.com':      'MRNA',
  'jnj.com':            'JNJ',

  // Swiss (SIX Swiss Exchange)
  'nestle.com':         'NESN.SW',
  'ubs.com':            'UBSG.SW',
  'zurich.com':         'ZURN.SW',
  'lonza.com':          'LONN.SW',
  'sika.com':           'SIKA.SW',
  'swisscom.ch':        'SCMN.SW',
  'credit-suisse.com':  'UBSG.SW',
  'novartis.com':       'NOVN.SW',
  'roche.com':          'ROG.SW',
  'abb.com':            'ABBN.SW',

  // German (XETRA)
  'volkswagen.com':     'VOW3.DE',
  'bmw.com':            'BMW.DE',
  'mercedes-benz.com':  'MBG.DE',
  'sap.com':            'SAP.DE',
  'siemens.com':        'SIE.DE',
  'allianz.com':        'ALV.DE',
  'basf.com':           'BAS.DE',

  // French (Euronext Paris)
  'lvmh.com':           'MC.PA',
  'totalenergies.com':  'TTE.PA',
  'airbus.com':         'AIR.PA',

  // Dutch
  'asml.com':           'ASML.AS',
  'shell.com':          'SHEL.AS',

  // UK (London Stock Exchange)
  'bp.com':             'BP.L',

  // Asian
  'samsung.com':        'SSNLF',
  'sony.com':           'SONY',
  'toyota.com':         'TM',
  'honda.com':          'HMC',
  'alibaba.com':        'BABA',
  'tsmc.com':           'TSM',
};
