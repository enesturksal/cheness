// Downloads the pinned single-threaded Stockfish build into public/stockfish.
// The engine files are committed to the repo, so this is only needed when upgrading.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION = '19.0.0';
const BASE = `https://unpkg.com/stockfish@${VERSION}/`;
const FILES = [
  'bin/stockfish-19-lite-single.js',
  'bin/stockfish-19-lite-single.wasm',
  'Copying.txt',
];
const OUT_DIR = path.resolve('public/stockfish');

await mkdir(OUT_DIR, { recursive: true });
for (const file of FILES) {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const name = file === 'Copying.txt' ? 'COPYING.txt' : path.basename(file);
  await writeFile(path.join(OUT_DIR, name), buf);
  const sha = createHash('sha256').update(buf).digest('hex');
  console.log(`${name}  ${(buf.length / 1024).toFixed(0)} KiB  sha256=${sha}`);
}
console.log('done; update the hashes in README.md if the engine version changed');
