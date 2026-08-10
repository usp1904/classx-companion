const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' :: ' + ((r.failure() || {}).errorText || '')));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 }).catch(e => errors.push('GOTO: ' + e.message));
  await page.waitForTimeout(4000);
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  console.log('ROOT_LEN=' + rootLen);
  console.log('BODY=' + bodyText);
  console.log('ERRORS=' + JSON.stringify(errors, null, 2));
  await browser.close();
})();
