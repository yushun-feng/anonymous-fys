/**
 * Smoke: unlock gate → C++ tab → Run → expect stdout "sum = 10" via local WASM.
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:4173/anonymous-fys/';
const PASSWORD = process.env.VITE_SITE_PASSWORD || 'notes';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
});
const page = await browser.newPage();
page.setDefaultTimeout(300_000);

const logs = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') logs.push(`console.error: ${msg.text()}`);
});
page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('input[type="password"], input[name="password"], [data-gate-password]').first().fill(PASSWORD);
await page.locator('button[type="submit"], [data-gate-submit]').first().click();
await page.locator('[data-playground], .playground').waitFor({ state: 'visible', timeout: 30_000 });

await page.locator('[data-pg-lang="cpp"]').click();
await page.locator('[data-pg-run]').click();

const output = page.locator('[data-pg-output]');
await output.waitFor({ state: 'visible' });

// Wait until local compile finishes or fails with a clear marker.
await page.waitForFunction(
  () => {
    const el = document.querySelector('[data-pg-output]');
    const text = el?.textContent || '';
    return (
      text.includes('sum = 10') ||
      text.includes('✓ 完成（浏览器内') ||
      text.includes('本地编译失败') ||
      text.includes('加载本地 WASM 工具链失败') ||
      text.includes('编译过程异常') ||
      text.includes('运行失败')
    );
  },
  null,
  { timeout: 280_000 },
);

const text = await output.textContent();
console.log('---- playground output ----');
console.log(text);
console.log('---- end ----');
if (logs.length) {
  console.log('browser issues:', logs.slice(0, 20).join('\n'));
}

const ok = text.includes('sum = 10');
await browser.close();
if (!ok) {
  console.error('SMOKE FAILED: expected stdout sum = 10');
  process.exit(1);
}
console.log('SMOKE OK');
