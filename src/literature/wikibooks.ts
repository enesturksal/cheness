/**
 * Opening theory text from Wikibooks "Chess Opening Theory" (CC BY-SA), one page per line,
 * fetched through the MediaWiki API (CORS enabled with origin=*). When the exact line has no
 * page we fall back to the nearest ancestor that has one.
 */
import { kvGet, kvSet } from '../explorer/cache';

const API = 'https://en.wikibooks.org/w/api.php';
export const WIKIBOOKS_BASE = 'https://en.wikibooks.org/wiki/';

export interface TheorySection {
  heading: string;
  /** Paragraph and list-item texts. */
  paragraphs: string[];
  /** Rows of the "theory table" style tables, as cell texts. */
  rows: string[][];
}

export interface TheoryPage {
  title: string;
  url: string;
  /** How many plies of the requested line this page covers. */
  plies: number;
  sections: TheorySection[];
}

/** "Chess Opening Theory/1. e4/1...c5/2. Nf3" for SAN moves from the start position. */
export function theoryTitle(sans: readonly string[]): string {
  const parts = sans.map((san, i) => {
    const n = Math.floor(i / 2) + 1;
    return i % 2 === 0 ? `${n}. ${san}` : `${n}...${san}`;
  });
  return ['Chess Opening Theory', ...parts].join('/');
}

export function theoryUrl(title: string): string {
  return WIKIBOOKS_BASE + encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/');
}

const SKIP_HEADINGS = /^(references|see also|external links|notes)$/i;

/** Turn the page HTML into plain sections. Runs in the browser (DOMParser). */
export function parseTheoryHtml(html: string): TheorySection[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('.mw-parser-output') ?? doc.body;
  const sections: TheorySection[] = [];
  let current: TheorySection = { heading: '', paragraphs: [], rows: [] };
  const clean = (s: string) =>
    s
      .replace(/\[edit\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  const push = () => {
    if (current.paragraphs.length || current.rows.length) sections.push(current);
  };
  for (const el of Array.from(root.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      push();
      current = { heading: clean(el.textContent ?? ''), paragraphs: [], rows: [] };
      if (SKIP_HEADINGS.test(current.heading)) break;
    } else if (tag === 'p') {
      const t = clean(el.textContent ?? '');
      if (t) current.paragraphs.push(t);
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const t = clean(li.textContent ?? '');
        if (t) current.paragraphs.push(`• ${t}`);
      }
    } else if (tag === 'table' || tag === 'div') {
      for (const tr of Array.from(el.querySelectorAll('tr'))) {
        const cells = Array.from(tr.querySelectorAll('td,th'))
          .map((c) => clean(c.textContent ?? ''))
          .filter(Boolean);
        if (cells.length >= 2) current.rows.push(cells);
      }
    }
  }
  push();
  return sections;
}

interface CachedPage {
  missing: boolean;
  html?: string;
}

async function fetchPage(title: string, signal?: AbortSignal): Promise<CachedPage> {
  const key = `wb|${title}`;
  const cached = await kvGet<CachedPage>(key);
  if (cached) return cached;
  const p = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'text',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    origin: '*',
  });
  const res = await fetch(`${API}?${p.toString()}`, { signal });
  if (!res.ok) throw new Error(`Wikibooks HTTP ${res.status}`);
  const json = (await res.json()) as {
    parse?: { text?: string };
    error?: { code?: string };
  };
  let out: CachedPage;
  if (json.error?.code === 'missingtitle' || !json.parse?.text) out = { missing: true };
  else out = { missing: false, html: json.parse.text };
  void kvSet(key, out);
  return out;
}

/**
 * Theory for a line, falling back to ancestors (at most `maxBack` plies) when the exact page
 * does not exist. Returns null when nothing is found.
 */
export async function fetchTheory(
  sans: readonly string[],
  maxBack = 4,
  signal?: AbortSignal,
): Promise<TheoryPage | null> {
  for (let back = 0; back <= maxBack && sans.length - back >= 0; back++) {
    const line = sans.slice(0, sans.length - back);
    const title = theoryTitle(line);
    const page = await fetchPage(title, signal);
    if (!page.missing && page.html) {
      return {
        title,
        url: theoryUrl(title),
        plies: line.length,
        sections: parseTheoryHtml(page.html),
      };
    }
    if (line.length === 0) break;
  }
  return null;
}
