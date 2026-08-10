const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '_shot.png' });
  const info = await page.evaluate(() => {
    const body = document.body;
    const cs = getComputedStyle(body);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      rootDisplay: document.getElementById('root') ? 'yes' : 'no',
      rootChildren: document.getElementById('root').childElementCount,
      mainW: document.querySelector('.main') ? document.querySelector('.main').clientWidth : -1,
      mainH: document.querySelector('.main') ? document.querySelector('.main').clientHeight : -1,
    };
  });
  console.log('INFO=' + JSON.stringify(info));
  console.log('ERRORS=' + JSON.stringify(errors));
  await browser.close();
})();