// 공통 유틸: 경로, 브랜드 토큰, 폰트, 브라우저, 해시
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

export async function writeJson(p, data) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

export async function loadBrand() {
  return readJson(path.join(ROOT, 'brand', 'brand.json'));
}

export function trackTokens(brand, trackName) {
  const track = brand.tracks[trackName];
  if (!track) {
    throw new Error(`알 수 없는 트랙 "${trackName}". brand/brand.json의 tracks 중 하나여야 합니다: ${Object.keys(brand.tracks).join(', ')}`);
  }
  return track;
}

// file:// 로 직접 읽는 폰트 CSS (Pretendard, Noto Serif KR — 모두 OFL)
export function fontLinks() {
  const nm = path.join(ROOT, 'node_modules');
  const css = [
    path.join(nm, 'pretendard', 'dist', 'web', 'static', 'pretendard.css'),
    path.join(nm, '@fontsource', 'noto-serif-kr', '400.css'),
    path.join(nm, '@fontsource', 'noto-serif-kr', '700.css'),
  ];
  return css.map(p => `<link rel="stylesheet" href="${pathToFileURL(p).href}">`).join('\n');
}

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 줄바꿈(\n)을 <br>로. 카피 작성자가 의도한 줄바꿈을 그대로 살린다.
export function lines(s) {
  return esc(s).replace(/\n/g, '<br>');
}

// **강조** 표기를 accent 색 span으로
export function rich(s) {
  return lines(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');
}

export function assetUrl(p, baseDir) {
  if (!p) return null;
  if (/^https?:\/\//.test(p) || p.startsWith('data:')) return p;
  const abs = path.isAbsolute(p) ? p : path.resolve(baseDir, p);
  return pathToFileURL(abs).href;
}

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  // 1) CHROMIUM_PATH 2) Playwright 기본 브라우저 3) 사전 설치 경로 순으로 시도
  const candidates = [...new Set([process.env.CHROMIUM_PATH || undefined, undefined, '/opt/pw-browsers/chromium'])];
  let lastErr;
  for (const executablePath of candidates) {
    try {
      return await chromium.launch({ executablePath, args: ['--allow-file-access-from-files'] });
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Chromium 실행 실패. 'npx playwright install chromium'을 실행하거나 CHROMIUM_PATH를 지정하세요.\n${lastErr?.message}`);
}

export async function sha256File(p) {
  return createHash('sha256').update(await readFile(p)).digest('hex');
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else {
      args._.push(a);
    }
  }
  return args;
}

export function campaignDir(idOrPath) {
  if (!idOrPath) throw new Error('캠페인 ID 또는 경로가 필요합니다. 예: content/campaigns/2026-10-06-heman');
  if (idOrPath.includes('/')) return path.resolve(ROOT, idOrPath);
  return path.join(ROOT, 'content', 'campaigns', idOrPath);
}

export async function ffmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const mod = await import('@ffmpeg-installer/ffmpeg');
    return (mod.default ?? mod).path;
  } catch {
    return 'ffmpeg';
  }
}
