const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);
  const txt = await page.evaluate(() => document.body.innerText);
  console.log('HAS_MODULES_TEXT=' + txt.includes('Active System Modules'));
  console.log('HAS_CURRICULUM=' + txt.includes('curriculum-guard'));
  console.log('HAS_SYSTEM=' + txt.toLowerCase().includes('system'));
  console.log('--- OVERVIEW SNIPPET ---');
  console.log(txt.slice(0, 800));
  await browser.close();
})();