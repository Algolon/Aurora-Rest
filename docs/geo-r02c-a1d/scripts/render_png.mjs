// Rasterise A1-D SVGs to PNG with the pre-installed Chromium (Playwright). Usage: node render_png.mjs <scale> <in.svg> [more.svg ...]
// Each SVG is rendered at its viewBox size x scale next to the source file (same basename, .png).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const [scale, ...files] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
for (const f of files) {
  const abs = resolve(f); const svg = readFileSync(abs, 'utf8');
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: Number(scale) });
  await page.goto('file://' + abs); await page.waitForTimeout(150);
  await page.screenshot({ path: abs.replace(/\.svg$/, '.png'), clip: { x: 0, y: 0, width: w, height: h } });
  await page.close(); console.log('png', abs.replace(dirname(abs) + '/', '').replace(/\.svg$/, '.png'));
}
await browser.close();
