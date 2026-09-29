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
await page.goto(URL, { waitUntil: 'load' });
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
  await page.waitForSelector('.kind', { timeout: 90000 });
  await page.waitForTimeout(500);
  console.log(
    'analysis rows:',
    await page.locator('.kind').count(),
    'eval bar:',
    await page.locator('.evalbar').count(),
  );
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

// Theory tab (Wikibooks)
await tab(page, /^(Teori|Theory)$/);
try {
  await page.waitForSelector('text=/Wikibooks/', { timeout: 30000 });
  await page.waitForFunction(
    () => !/Teori yükleniyor|Loading theory/.test(document.body.innerText),
    { timeout: 30000 },
  );
  const theory = (await text(page)).includes('Wikibooks');
  console.log('theory tab:', theory ? 'ok' : 'FAILED');
  await shot(page, '04b-theory');
} catch {
  fail('theory tab did not load');
}

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
await page.waitForSelector('text=Sicilian Defense');
const familyRows = await page.locator('button:has(span.eco)').count();
console.log('openings page rows:', familyRows);
if (familyRows < 40) fail('openings page shows too few families');
await shot(page, '07-openings');

// ---- Lessons (Lichess study) ----
await page
  .getByRole('button', { name: /^(Ana sayfa|Home)$/ })
  .first()
  .click();
await page
  .getByRole('button', { name: /^(Dersler|Lessons)/ })
  .first()
  .click();
await page.waitForSelector('text=/Tuzaklar ve gambitler|Traps and gambits/');
await shot(page, '07a-studies');
await page.locator('input').fill('https://lichess.org/study/jsSks17H');
await page
  .getByRole('button', { name: /^(Aç|Open)$/ })
  .first()
  .click();
try {
  await page.waitForSelector('text=/Sonraki hamle|Next move/', { timeout: 60000 });
  await page.getByRole('button', { name: /Sonraki hamle|Next move/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Sonraki hamle|Next move/ }).click();
  await page.waitForTimeout(300);
  console.log('lesson chapter opened, two lesson moves played: ok');
} catch (e) {
  fail('lesson did not open: ' + e.message);
}
await shot(page, '07a-lesson');

// ---- My games (chess.com public API) ----
await page
  .getByRole('button', { name: /^(Ana sayfa|Home)$/ })
  .first()
  .click();
await page
  .getByRole('button', { name: /^(Oyunlarım|My games)/ })
  .first()
  .click();
await page.getByRole('button', { name: 'chess.com' }).click();
await page.locator('input').fill('hikaru');
await page.getByRole('button', { name: /Oyunları getir|Fetch games/ }).click();
try {
  await page.waitForSelector('text=/Son oyunlar|Recent games/', { timeout: 60000 });
  console.log(
    'chess.com games:',
    await page.locator('button:has-text("İncele"), button:has-text("Review")').count(),
  );
} catch {
  // chess.com sits behind a bot check that headless Chrome sometimes fails: warn only.
  console.log('chess.com games: not loaded (bot check?) - verify in a real browser');
}
await shot(page, '07b-my-games');

// ---- Profile ----
await page
  .getByRole('button', { name: /^(Profil|Profile)$/ })
  .first()
  .click();
await page.waitForSelector('text=/Lichess ile giriş yap|Log in with Lichess/');
await shot(page, '07c-profile');

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
await touch.goto(URL, { waitUntil: 'load' });
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
await desk.goto(URL, { waitUntil: 'load' });
await desk.waitForSelector('text=/Arkadaşınla oyna|Play with a friend/');
await shot(desk, '11-desktop-home');
await startButton(desk).click();
await desk.waitForSelector('cg-board', { timeout: 30000 });
await desk.waitForTimeout(1000);
await shot(desk, '12-desktop-play');

// chess.com's bot check and React's dev-only warning about chessground's <piece> element are noise.
const relevant = errors.filter(
  (e) => !/api\.chess\.com|ERR_FAILED|tag <(%s|piece)> is unrecognized/.test(e),
);
if (relevant.length) {
  console.log('console errors/warnings:\n' + relevant.join('\n'));
  fail('console reported errors');
}
console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK', `(screenshots in ${OUT}/)`);
await browser.close();
