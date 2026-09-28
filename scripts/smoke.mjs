// End-to-end smoke test: drives the app in headless Chrome and saves screenshots.
//
//   npm run dev            # in another terminal (or `vite preview --port 4173`)
//   npm run smoke -- http://localhost:5173/
//
// Needs Google Chrome installed (playwright-core uses the `chrome` channel, no browser download).
// Exercises: the home screen, moving by click and by touch, the bot reply, move analysis,
// arrows, the opening panel (preview arrow, play from panel), undo, tabs, PGN import + report,
// the Openings screen, the library and "practice as Black".
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:5173/';
const OUT = 'smoke-shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

async function newPage(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return page;
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const text = async (page) => (await page.innerText('body')).replace(/\n{2,}/g, '\n');
const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};
const startButton = (page) => page.getByRole('button', { name: /^(Başla|Start)$/ }).first();
const tab = (page, re) => page.getByRole('button', { name: re }).first().click();

async function clickSquare(page, file, rank) {
  const b = await page.locator('cg-board').boundingBox();
  const sq = b.width / 8;
  // rank 8 is the top row, so rank r sits at row index 8 - r
  await page
    .locator('cg-board')
    .click({ position: { x: (file + 0.5) * sq, y: (8 - rank + 0.5) * sq } });
}

// ---- Phone viewport, mouse input ----
const page = await newPage({ width: 390, height: 844 }, { deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('text=/Arkadaşınla oyna|Play with a friend/', { timeout: 30000 });
await shot(page, '00-home');
await startButton(page).click();
await page.waitForSelector('cg-board', { timeout: 30000 });
await page.waitForTimeout(500);
await shot(page, '01-start');

await clickSquare(page, 4, 2); // e2
await page.waitForTimeout(150);
await clickSquare(page, 4, 4); // e4
await page.waitForFunction(() => document.body.innerText.includes('1. e4'), { timeout: 30000 });
console.log('own move: ok');

await page.waitForFunction(() => /1\. e4 [a-hNBRQKO]/.test(document.body.innerText), {
  timeout: 120000,
});
console.log('bot reply: ok');
await page.waitForTimeout(1500);
console.log('arrows on board:', await page.locator('.cg-shapes g').count());
await shot(page, '02-bot-replied');

try {
  await page.waitForSelector('.evalbar', { timeout: 90000 });
  await page.waitForTimeout(500);
  const line = (await page.locator('.evalbar').locator('..').innerText()).replace(/\n/g, ' ');
  console.log('analysis:', line);
  await tab(page, /^(Hamleler|Moves)$/);
  await page.waitForTimeout(300);
  console.log('badges in move list:', await page.locator('.kind').count());
  await shot(page, '03-analysis');
  await tab(page, /^(Açılış|Opening)$/);
} catch (e) {
  fail('move analysis did not appear: ' + e.message);
}

const rows = page.locator('.card button:has(span.eco)');
if ((await rows.count()) > 0) {
  const san = (await rows.first().innerText()).split('\n')[0];
  await rows.first().click();
  await page.waitForTimeout(300);
  const arrows = await page.locator('.cg-shapes g').count();
  console.log('preview arrow:', arrows > 0 ? 'ok' : 'MISSING');
  if (!arrows) fail('no arrow after first tap');
  await shot(page, '04-preview-arrow');
  await rows.first().click();
  await page.waitForTimeout(400);
  const played = (await text(page)).includes(san);
  console.log('play from panel:', played ? 'ok' : 'FAILED');
  if (!played) fail('second tap did not play the move');
} else fail('no book continuations listed');

await page.getByRole('button', { name: /^(Geri al|Undo)$/ }).click();
await page.waitForTimeout(300);
await tab(page, /^(Ayarlar|Settings)$/);
await page.waitForTimeout(200);
await shot(page, '05-settings');

// ---- PGN import + report ----
await page
  .getByRole('button', { name: /^(Ana sayfa|Home)$/ })
  .first()
  .click();
await page.waitForSelector('textarea');
await page
  .locator('textarea')
  .fill(
    '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Nb4',
  );
await page.getByRole('button', { name: /Oyunu analiz et|Analyse game/ }).click();
await page.waitForSelector('text=/Doğruluk|Accuracy/', { timeout: 15000 });
try {
  await page.waitForFunction(
    () => /\d+(\.\d+)?%\s*(Doğruluk|Accuracy)/.test(document.body.innerText),
    {
      timeout: 120000,
    },
  );
  console.log('report accuracy: ok');
} catch {
  fail('report accuracy did not appear');
}
await shot(page, '06-report');

// ---- Openings screen ----
await page
  .getByRole('button', { name: /^(Ana sayfa|Home)$/ })
  .first()
  .click();
await page
  .getByRole('button', { name: /^(Açılışlar|Openings)/ })
  .first()
  .click();
await page.waitForSelector('text=Italian Game');
await page.getByRole('button', { name: /^(Siyah için|For Black)$/ }).click();
await page.waitForSelector('text=Sicilian Defense');
await shot(page, '07-openings');

// ---- Library ----
await page
  .getByRole('button', { name: /^(Ana sayfa|Home)$/ })
  .first()
  .click();
await page
  .getByRole('button', { name: /^(Kütüphane|Library)/ })
  .first()
  .click();
await page.waitForSelector('text=/Kanat açılışları|Flank openings/');
await page.getByText(/Yarı açık oyunlar|Semi-open games/).click();
await page.getByText('Sicilian Defense', { exact: true }).first().click();
await page.waitForSelector('text=/Najdorf/');
await page
  .getByText(/^Najdorf Variation$/)
  .first()
  .click();
await page.waitForSelector('cg-board');
await page.waitForTimeout(400);
await shot(page, '08-entry-detail');
await page.getByRole('button', { name: /Siyah ile çalış|Practice as Black/ }).click();
await page.waitForSelector('cg-board');
await page.waitForTimeout(3000);
console.log('practice as black:', (await text(page)).includes('Najdorf') ? 'ok' : 'FAILED');
await shot(page, '09-practice-black');

// ---- Touch input, pass-and-play ----
const touch = await newPage(
  { width: 390, height: 844 },
  { deviceScaleFactor: 2, isMobile: true, hasTouch: true },
);
await touch.goto(URL, { waitUntil: 'networkidle' });
await touch.waitForSelector('text=/Arkadaşınla oyna|Play with a friend/');
await touch
  .getByRole('button', { name: /^(Başla|Start)$/ })
  .nth(1)
  .click();
await touch.waitForSelector('cg-board', { timeout: 30000 });
await touch.waitForTimeout(300);
const tb = await touch.locator('cg-board').boundingBox();
const tsq = tb.width / 8;
await touch.touchscreen.tap(tb.x + 3.5 * tsq, tb.y + 6.5 * tsq); // d2
await touch.waitForTimeout(150);
await touch.touchscreen.tap(tb.x + 3.5 * tsq, tb.y + 4.5 * tsq); // d4
await touch.waitForTimeout(600);
const touched = (await text(touch)).includes('1. d4');
console.log('touch move (pass and play):', touched ? 'ok' : 'FAILED');
if (!touched) fail('touch tap did not move');
await shot(touch, '10-pass-and-play');

// ---- Desktop layout ----
const desk = await newPage({ width: 1280, height: 800 });
await desk.goto(URL, { waitUntil: 'networkidle' });
await desk.waitForSelector('text=/Arkadaşınla oyna|Play with a friend/');
await shot(desk, '11-desktop-home');
await startButton(desk).click();
await desk.waitForSelector('cg-board', { timeout: 30000 });
await desk.waitForTimeout(1000);
await shot(desk, '12-desktop-play');

if (errors.length) {
  console.log('console errors/warnings:\n' + errors.join('\n'));
  fail('console reported errors');
}
console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK', `(screenshots in ${OUT}/)`);
await browser.close();
