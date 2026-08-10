const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' :: ' + ((r.failure() || {}).errorText || '')));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP' + r.status() + ': ' + r.url()); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 }).catch(e => errors.push('GOTO: ' + e.message));
  for (const t of [3000, 3000, 5000, 8000]) {
    await page.waitForTimeout(t);
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootLen: root ? root.innerHTML.length : -1,
        rootChildren: root ? root.childElementCount : -1,
        bodyText: document.body.innerText.slice(0, 200)
      };
    });
    console.log('T+' + t + 'ms ', JSON.stringify(info));
  }
  console.log('ERRORS=' + JSON.stringify(errors, null, 2));
  await browser.close();
})();