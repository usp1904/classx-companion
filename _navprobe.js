const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message).slice(0, 500)));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP' + r.status() + ': ' + r.url()); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);
  const navs = [
    'Overview','Concepts','Theorems','Examples','Exercises',
    'RD Sharma','RS Aggarwal','Model Papers','Practice Quizzes','Vedic Math',
    'Mind Maps','Interactive','Media Overview','RAG Hybrid Search','AI Tutor','My Account','Leaderboard'
  ];
  for (const label of navs) {
    const clicked = await page.evaluate((lbl) => {
      const els = Array.from(document.querySelectorAll('.nav-btn'));
      const el = els.find(e => e.textContent.includes(lbl));
      if (el) { el.click(); return true; }
      return false;
    }, label);
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      const bt = document.body.innerText;
      return { len: root ? root.innerHTML.length : -1, txt: bt.slice(0, 120).replace(/\n/g, '|') };
    });
    console.log(`${clicked ? 'CLICK' : 'MISS '} ${label} => rootLen=${info.len} body="${info.txt}"`);
    if (info.len < 200) await page.screenshot({ path: `_crash_${label.replace(/[^a-z]/gi,'')}.png` });
  }
  console.log('ERRORS=' + JSON.stringify(errors, null, 2));
  await browser.close();
})();