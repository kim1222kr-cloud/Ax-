#!/usr/bin/env node
// 숏폼 조립기: <캠페인>/shortform.json → out/shortform/short.mp4 + cover.jpg + captions.srt
// 장면 PNG(HTML 렌더) + (선택) TTS 내레이션 + (선택) BGM → H.264/AAC 1080x1920 30fps
// 사용법: npm run build:short -- content/campaigns/<id> [--no-tts] [--allow-overflow]
import path from 'node:path';
import { mkdir, writeFile, rm, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readJson, loadBrand, trackTokens, launchBrowser, parseArgs, campaignDir, exists, ffmpegPath } from './lib/common.mjs';
import { sceneHtml } from './lib/shortform-html.mjs';
import { synthesize } from './lib/tts.mjs';

const FPS = 30;

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(err) : reject(new Error(`ffmpeg 실패(${code}): ${err.split('\n').slice(-6).join('\n')}`)));
  });
}

async function mediaDuration(ff, file) {
  // ffprobe 없이 ffmpeg 헤더 출력에서 길이를 읽는다
  const out = await new Promise(resolve => {
    const p = spawn(ff, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', () => resolve(err));
  });
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`길이를 읽지 못했습니다: ${file}`);
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

const plain = s => String(s ?? '').replace(/\*\*/g, '').replace(/\s*\n\s*/g, ' ').trim();

// 내레이션이 없을 때 읽기 시간 기준 자동 길이 (한국어 약 8자/초 + 여유)
function autoDuration(scene) {
  const n = plain(scene.text || scene.title || '').length;
  return Math.min(7, Math.max(2.2, 1.2 + n / 8));
}

function srtTime(t) {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}

export async function buildShortform(dir, { noTts = false, allowOverflow = false, quiet = false } = {}) {
  const specPath = path.join(dir, 'shortform.json');
  if (!(await exists(specPath))) throw new Error(`${specPath} 가 없습니다.`);
  const spec = await readJson(specPath);
  const brand = await loadBrand();
  const track = trackTokens(brand, spec.track || 'essay');
  const fmt = brand.formats[spec.format || 'short_9x16'];
  const scenes = spec.scenes || [];
  if (!scenes.length) throw new Error('scenes가 비어 있습니다.');
  const voice = noTts ? { provider: 'none' } : (spec.voice || { provider: 'none' });
  const aiVoice = voice.provider && voice.provider !== 'none';
  const ff = await ffmpegPath();

  const outDir = path.join(dir, 'out', 'shortform');
  const work = path.join(dir, '.work', 'shortform');
  await rm(outDir, { recursive: true, force: true });
  await rm(work, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(work, { recursive: true });

  // 1) 장면 이미지 렌더
  const browser = await launchBrowser();
  const report = [];
  try {
    const page = await browser.newPage({ viewport: { width: fmt.width, height: fmt.height } });
    for (let i = 0; i < scenes.length; i++) {
      const html = sceneHtml({ brand, track, fmt, spec, scene: scenes[i], idx: i, total: scenes.length, baseDir: dir, aiVoice });
      const hp = path.join(work, `scene-${i}.html`);
      await writeFile(hp, html, 'utf8');
      await page.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
      const fit = await page.evaluate(() => window.__fit());
      await page.screenshot({ path: path.join(work, `scene-${i}.png`), type: 'png' });
      report.push({ scene: i + 1, type: scenes[i].type, ...fit });
    }
  } finally {
    await browser.close();
  }
  const overflow = report.filter(r => r.overflow);
  if (overflow.length && !allowOverflow) {
    throw new Error(`텍스트가 넘친 장면: ${overflow.map(o => o.scene).join(', ')}. 문장을 줄이거나 장면을 나누세요.`);
  }

  // 2) 내레이션 합성 + 장면 길이 결정
  const timeline = [];
  let t = 0;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const narration = plain(s.narration ?? s.text ?? s.copy ?? '');
    let audio = null, audioDur = 0;
    if (aiVoice && narration && s.narration !== '') {
      const parts = await synthesize({ ...voice, text: narration, outBase: path.join(work, `vo-${i}`) });
      if (parts.length > 1) {
        audio = path.join(work, `vo-${i}-joined.mp3`);
        const list = path.join(work, `vo-${i}.txt`);
        await writeFile(list, parts.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
        await run(ff, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', audio]);
      } else {
        audio = parts[0] ?? null;
      }
      if (audio) audioDur = await mediaDuration(ff, audio);
    }
    const dur = Math.round(Math.max(s.duration ?? autoDuration(s), audioDur ? audioDur + 0.45 : 0) * FPS) / FPS;
    timeline.push({ i, start: t, dur, audio, narration });
    t += dur;
  }
  if (t > 180) throw new Error(`총 길이 ${t.toFixed(1)}초: 쇼츠·릴스 권장 상한 180초를 넘습니다.`);

  // 3) 장면별 클립 (같은 코덱 파라미터 → concat copy 가능)
  const clips = [];
  for (const seg of timeline) {
    const s = scenes[seg.i];
    const img = path.join(work, `scene-${seg.i}.png`);
    const clip = path.join(work, `clip-${seg.i}.mp4`);
    const frames = Math.round(seg.dur * FPS);
    const vf = s.motion === 'zoom'
      // 4배 업스케일 후 줌: 정수 반올림으로 인한 흔들림 최소화
      ? `scale=${fmt.width * 4}:${fmt.height * 4},zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${fmt.width}x${fmt.height}:fps=${FPS},format=yuv420p`
      : `fps=${FPS},format=yuv420p`;
    const inputs = s.motion === 'zoom' ? ['-i', img] : ['-loop', '1', '-framerate', String(FPS), '-i', img];
    const audioIn = seg.audio ? ['-i', seg.audio] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'];
    await run(ff, [
      '-y', ...inputs, ...audioIn,
      '-vf', vf, '-af', `apad,atrim=0:${seg.dur.toFixed(3)},aresample=44100`,
      '-t', seg.dur.toFixed(3), '-frames:v', String(frames),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-ar', '44100',
      clip,
    ]);
    clips.push(clip);
  }

  // 4) 이어 붙이기 + BGM
  const list = path.join(work, 'clips.txt');
  await writeFile(list, clips.map(c => `file '${c}'`).join('\n'));
  const joined = path.join(work, 'joined.mp4');
  await run(ff, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', joined]);
  const final = path.join(outDir, 'short.mp4');
  if (spec.bgm) {
    const bgm = path.isAbsolute(spec.bgm) ? spec.bgm : path.resolve(dir, spec.bgm);
    const vol = spec.bgm_volume ?? (aiVoice ? 0.12 : 0.35);
    await run(ff, ['-y', '-i', joined, '-stream_loop', '-1', '-i', bgm,
      '-filter_complex', `[1:a]volume=${vol},afade=t=out:st=${Math.max(0, t - 1.2).toFixed(2)}:d=1.2[b];[0:a][b]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', final]);
  } else {
    await copyFile(joined, final);
  }

  // 5) 커버 이미지 + 자막(SRT)
  await run(ff, ['-y', '-i', path.join(work, `scene-${spec.cover_scene ?? 0}.png`), '-q:v', '3', path.join(outDir, 'cover.jpg')]);
  const srt = timeline
    .filter(seg => seg.narration)
    .map((seg, k) => `${k + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.start + seg.dur - 0.05)}\n${seg.narration}\n`)
    .join('\n');
  await writeFile(path.join(outDir, 'captions.srt'), srt, 'utf8');

  const total = await mediaDuration(ff, final);
  if (!quiet) {
    for (const r of report) {
      const seg = timeline[r.scene - 1];
      const flag = r.overflow ? '❌ 넘침' : r.scale < 1 ? `⚠️ 자동축소 ${Math.round(r.scale * 100)}%` : '✅';
      console.log(`  ${String(r.scene).padStart(2, '0')} ${r.type.padEnd(7)} ${seg.dur.toFixed(2)}s ${seg.audio ? '🔊' : '  '} ${flag}`);
    }
    console.log(`→ ${path.relative(process.cwd(), final)} (${total.toFixed(1)}초, ${aiVoice ? `TTS: ${voice.provider}` : '내레이션 없음'}${spec.bgm ? ', BGM' : ''})`);
  }
  return { final, total, timeline, report };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  buildShortform(campaignDir(args._[0]), { noTts: !!args['no-tts'], allowOverflow: !!args['allow-overflow'] })
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
