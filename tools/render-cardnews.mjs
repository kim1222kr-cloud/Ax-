#!/usr/bin/env node
// 카드뉴스 렌더러: <캠페인>/cardnews.json → <캠페인>/out/cardnews/NN.png + NN.jpg + contact-sheet.jpg
// 사용법: npm run render:card -- content/campaigns/<id> [--allow-overflow]
import path from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readJson, loadBrand, trackTokens, launchBrowser, parseArgs, campaignDir, exists } from './lib/common.mjs';
import { slideHtml } from './lib/cardnews-html.mjs';

export async function renderCardnews(dir, { allowOverflow = false, quiet = false } = {}) {
  const specPath = path.join(dir, 'cardnews.json');
  if (!(await exists(specPath))) throw new Error(`${specPath} 가 없습니다.`);
  const spec = await readJson(specPath);
  const brand = await loadBrand();
  const track = trackTokens(brand, spec.track || 'essay');
  const fmt = brand.formats[spec.format || 'card_4x5'];
  if (!fmt) throw new Error(`알 수 없는 format "${spec.format}". (card_4x5 | card_3x4)`);
  const slides = spec.slides || [];
  if (slides.length < 2 || slides.length > 20) throw new Error(`슬라이드 수는 2~20장이어야 합니다 (현재 ${slides.length}).`);
  if (slides.length > 10 && !quiet) console.warn(`⚠️ ${slides.length}장: 인스타그램 API 자동 발행은 10장까지입니다(앱 수동 업로드는 20장).`);

  const outDir = path.join(dir, 'out', 'cardnews');
  const workDir = path.join(dir, '.work', 'cardnews');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(workDir, { recursive: true });

  const browser = await launchBrowser();
  const report = [];
  try {
    const page = await browser.newPage({ viewport: { width: fmt.width, height: fmt.height }, deviceScaleFactor: 1 });
    for (let i = 0; i < slides.length; i++) {
      const html = slideHtml({ brand, track, fmt, spec, slide: slides[i], idx: i, total: slides.length, baseDir: dir });
      const htmlPath = path.join(workDir, `${String(i + 1).padStart(2, '0')}.html`);
      await writeFile(htmlPath, html, 'utf8');
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
      const fit = await page.evaluate(() => window.__fit());
      const name = String(i + 1).padStart(2, '0');
      await page.screenshot({ path: path.join(outDir, `${name}.png`), type: 'png' });
      // Instagram 콘텐츠 퍼블리싱 API는 JPEG만 받는다
      await page.screenshot({ path: path.join(outDir, `${name}.jpg`), type: 'jpeg', quality: 92 });
      report.push({ slide: i + 1, type: slides[i].type, ...fit });
    }

    // 검수용 컨택트 시트
    const cols = Math.min(5, slides.length);
    const thumbW = 360, thumbH = Math.round(thumbW * fmt.height / fmt.width);
    const rowsN = Math.ceil(slides.length / cols);
    const sheet = `<!doctype html><html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${thumbW}px);gap:12px;padding:12px;width:max-content">
      ${slides.map((_, i) => `<img src="${pathToFileURL(path.join(outDir, String(i + 1).padStart(2, '0') + '.png')).href}" style="width:${thumbW}px;height:${thumbH}px;display:block">`).join('')}
    </body></html>`;
    const sheetPath = path.join(workDir, 'sheet.html');
    await writeFile(sheetPath, sheet, 'utf8');
    await page.setViewportSize({ width: cols * (thumbW + 12) + 12, height: rowsN * (thumbH + 12) + 12 });
    await page.goto(pathToFileURL(sheetPath).href, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, 'contact-sheet.jpg'), type: 'jpeg', quality: 85, fullPage: true });
  } finally {
    await browser.close();
  }

  const overflows = report.filter(r => r.overflow);
  if (!quiet) {
    for (const r of report) {
      const flag = r.overflow ? '❌ 넘침' : r.scale < 1 ? `⚠️ 자동축소 ${Math.round(r.scale * 100)}%` : '✅';
      console.log(`  ${String(r.slide).padStart(2, '0')} ${r.type.padEnd(6)} ${flag}`);
    }
    console.log(`→ ${path.relative(process.cwd(), outDir)} (${slides.length}장 + contact-sheet.jpg)`);
  }
  if (overflows.length && !allowOverflow) {
    throw new Error(`텍스트가 넘친 슬라이드: ${overflows.map(o => o.slide).join(', ')}. 카피를 줄이거나 슬라이드를 나누세요.`);
  }
  return { outDir, report };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  renderCardnews(campaignDir(args._[0]), { allowOverflow: !!args['allow-overflow'] })
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
