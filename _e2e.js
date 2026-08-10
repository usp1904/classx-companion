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
  await page.waitForTimeout(2500);

  const results = {};

  // 1. Overview should show Active System Modules
  const hasModules = await page.evaluate(() => document.body.innerText.includes('Active System Modules'));
  results.overviewModules = hasModules;

  // 2. Navigate to AI Tutor
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.nav-btn')];
    const t = btns.find(b => b.innerText.includes('AI Tutor'));
    if (t) t.click();
  });
  await page.waitForTimeout(500);
  const tutorRendered = await page.evaluate(() => document.body.innerText.includes('AI Tutor'));
  // ask a question
  await page.fill('textarea', 'What is 2+2?');
  await page.click('button:has-text("Ask the AI Tutor")');
  await page.waitForTimeout(3000);
  const tutorAnswer = await page.evaluate(() => document.body.innerText.includes('Answer'));
  results.tutorRendered = tutorRendered;
  results.tutorAnswer = tutorAnswer;

  // 3. Leaderboard
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.nav-btn')];
    const t = btns.find(b => b.innerText.includes('Leaderboard'));
    if (t) t.click();
  });
  await page.waitForTimeout(1500);
  results.leaderboard = await page.evaluate(() => {
    const t = document.body.innerText;
    return t.includes('Leaderboard');
  });

  // 4. My Account (login form)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.nav-btn')];
    const t = btns.find(b => b.innerText.includes('My Account'));
    if (t) t.click();
  });
  await page.waitForTimeout(500);
  results.accountLoginForm = await page.evaluate(() => document.body.innerText.includes('Sign In'));
  results.accountRegisterBtn = await page.evaluate(() => document.body.innerText.includes('Create Account'));

  // 5. Register a fresh user and verify logged-in view
  // click the Register tab first
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.nav-btn')];
    const t = btns.find(b => b.innerText.includes('My Account'));
    if (t) t.click();
  });
  await page.waitForTimeout(500);
  await page.click('button:has-text("Register")');
  await page.waitForTimeout(300);
  await page.fill('input[type=text]', 'E2E Student');
  await page.fill('input[type=email]', 'e2e.' + Date.now() + '@classx.com');
  await page.fill('input[type=password]', 'secret123');
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(2000);
  results.accountLoggedIn = await page.evaluate(() => document.body.innerText.includes('Total XP'));
  results.xpVisible = await page.evaluate(() => document.body.innerText.includes('Total XP'));

  console.log('RESULTS=' + JSON.stringify(results, null, 2));
  console.log('ERRORS=' + JSON.stringify(errors));
  await browser.close();
})();