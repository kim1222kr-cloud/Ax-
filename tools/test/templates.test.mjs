// 포맷 템플릿 회귀 테스트: 스키마 유효성 + 카드뉴스 템플릿 렌더 시 텍스트 넘침 없음
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from '../lib/common.mjs';
import { SLIDE_TYPES } from '../lib/cardnews-html.mjs';
import { SCENE_TYPES } from '../lib/shortform-html.mjs';
import { renderCardnews } from '../render-cardnews.mjs';
import { buildShortform } from '../build-shortform.mjs';

const load = async (kind) => {
  const dir = path.join(ROOT, 'templates', kind);
  const files = (await readdir(dir)).filter(f => f.endsWith('.json')).sort();
  return Promise.all(files.map(async f => ({ f, spec: JSON.parse(await readFile(path.join(dir, f), 'utf8')) })));
};
// 템플릿 자리표시자는 실제 카피보다 길 수 있으니 이미지 경로만 제거하고 그대로 렌더한다
const strip = spec => {
  const s = structuredClone(spec);
  delete s._template;
  for (const x of [...(s.slides || []), ...(s.scenes || [])]) { delete x.image; delete x.cover; }
  return s;
};

test('카드뉴스 템플릿: 스키마·장수·해시태그', async () => {
  const list = await load('cardnews');
  assert.ok(list.length >= 9);
  for (const { f, spec } of list) {
    assert.equal(spec._template.format_id, f.replace('.json', ''), f);
    assert.equal(spec.format, 'card_4x5', f);
    assert.ok(spec.slides.length >= 2 && spec.slides.length <= 10, `${f} 장수`);
    for (const s of spec.slides) assert.ok(SLIDE_TYPES.includes(s.type), `${f} ${s.type}`);
    assert.ok(spec.hashtags.length <= 5, `${f} 해시태그`);
    assert.equal(spec.slides.at(-1).type, 'cta', `${f} 마지막 장은 CTA`);
  }
});

test('숏폼 템플릿: 스키마·훅 길이·핸들', async () => {
  const list = await load('shortform');
  assert.ok(list.length >= 8);
  for (const { f, spec } of list) {
    assert.equal(spec.format, 'short_9x16', f);
    for (const s of spec.scenes) assert.ok(SCENE_TYPES.includes(s.type), `${f} ${s.type}`);
    assert.equal(spec.scenes[0].type, 'hook', `${f} 첫 장면은 hook`);
    assert.ok((spec.scenes[0].duration ?? 3) <= 3, `${f} hook 3초 이내`);
    const cta = spec.scenes.find(s => s.type === 'cta');
    assert.equal(cta?.handle, '필름 출판사', `${f} 쇼츠 CTA 중립 핸들`);
    assert.ok(spec.hashtags.length <= 5, `${f} 해시태그`);
    const total = spec.scenes.reduce((n, s) => n + (s.duration || 3), 0);
    assert.ok(total >= 10 && total <= 60, `${f} 총 길이 ${total}s`);
  }
  // F06 은 광고 표기가 기본값
  const f06 = list.find(x => x.f === 'F06.json').spec;
  assert.equal(f06.disclosure, '광고');
  assert.ok(f06.title.startsWith('[광고]') && f06.caption.startsWith('[광고]') && f06.description.startsWith('[광고]'));
});

test('카드뉴스 템플릿 렌더: 모든 슬라이드가 넘치지 않는다', { timeout: 180000 }, async () => {
  for (const { f, spec } of await load('cardnews')) {
    const dir = await mkdtemp(path.join(os.tmpdir(), `tpl-${f}-`));
    await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(strip(spec)));
    const { report } = await renderCardnews(dir, { quiet: true });
    const over = report.filter(r => r.overflow);
    assert.equal(over.length, 0, `${f}: 넘친 슬라이드 ${over.map(o => o.slide)}`);
  }
});

test('숏폼 템플릿 빌드 스모크(F01): MP4·SRT·커버 생성', { timeout: 120000 }, async () => {
  const spec = (await load('shortform')).find(x => x.f === 'F01.json').spec;
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tpl-short-'));
  await writeFile(path.join(dir, 'shortform.json'), JSON.stringify(strip(spec)));
  const { total } = await buildShortform(dir, { quiet: true });
  assert.ok(total > 10 && total < 30, `길이 ${total}`);
});
