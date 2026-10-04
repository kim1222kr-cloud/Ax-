// node --test tools/test/  — 검수 규칙·승인 잠금·렌더러 회귀 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { lintCampaign } from '../lint-copy.mjs';
import { fingerprint, verifyPublishApproval, saveStatus } from '../lib/campaign.mjs';
import { approve } from '../approve.mjs';
import { splitText } from '../lib/tts.mjs';
import { renderCardnews } from '../render-cardnews.mjs';

async function fixture({ meta = {}, cardnews, shortform } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'feelm-'));
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify({ book: 'heman-mankeum', ...meta }));
  if (cardnews) await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify({ track: 'essay', book: 'heman-mankeum', ...cardnews }));
  if (shortform) await writeFile(path.join(dir, 'shortform.json'), JSON.stringify({ track: 'essay', ...shortform }));
  return dir;
}
const card = (slides, extra = {}) => ({ slides, caption: '캡션', hashtags: ['#필름출판사'], ...extra });
const rules = r => r.issues.filter(i => i.level === 'error').map(i => i.rule);

test('도서정가제: 10% 초과 할인·반값 표현은 오류', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '지금 30% 할인' }, { type: 'cta', title: '반값 이벤트' }]) });
  const r = await lintCampaign(dir);
  assert.equal(rules(r).filter(x => x === '도서정가제').length, 2);
});

test('도서정가제: 10% 할인은 허용', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '정가 10% 할인' }, { type: 'cta', title: '구매하기' }]) });
  assert.ok(!rules(await lintCampaign(dir)).includes('도서정가제'));
});

test('재테크: 수익 보장 표현은 오류', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '원금 보장되는 투자법' }, { type: 'cta', title: '무조건 오른다' }]) });
  assert.equal(rules(await lintCampaign(dir)).filter(x => x === '수익보장').length, 2);
});

test('수치: claims.json 에 없는 판매 부수는 오류, 등록된 회사 자료는 경고', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '벌써 3만 부 돌파' }, { type: 'stat', number: '50만', label: '독자가 사랑한 작가' }]) });
  const r = await lintCampaign(dir);
  assert.ok(rules(r).includes('미입증수치'));
  assert.ok(r.issues.some(i => i.rule === '회사자료수치' && i.where.includes('slides[2]')));
});

test('수치: unverified 로 등록된 수치는 사용 금지', async () => {
  const dir = await fixture({ meta: { book: 'hoksi-don-yaegi' }, cardnews: card([{ type: 'cover', title: '80만 유튜버의 첫 에세이' }, { type: 'cta', title: '구매' }], { book: 'hoksi-don-yaegi' }) });
  assert.ok(rules(await lintCampaign(dir)).includes('미입증수치'));
});

test('광고표기: 협찬 캠페인은 disclosure 와 캡션 첫머리 표기가 필요', async () => {
  const bad = await fixture({ meta: { sponsored: true }, cardnews: card([{ type: 'cover', title: 'A' }, { type: 'cta', title: 'B' }], { caption: '좋은 책 추천합니다\n\n#광고' }) });
  assert.equal(rules(await lintCampaign(bad)).filter(x => x === '광고표기').length, 2);
  const good = await fixture({ meta: { sponsored: true }, cardnews: card([{ type: 'cover', title: 'A' }, { type: 'cta', title: 'B' }], { caption: '[광고] 좋은 책 추천합니다', disclosure: '광고' }) });
  assert.ok(!rules(await lintCampaign(good)).includes('광고표기'));
});

test('AI표시: AI 음성을 쓰면 설명·캡션에 표시가 필요', async () => {
  const sf = { voice: { provider: 'elevenlabs' }, scenes: [{ type: 'hook', text: '훅' }], title: '제목', description: '설명', caption: '캡션', tags: [] };
  assert.ok(rules(await lintCampaign(await fixture({ shortform: sf }))).includes('AI표시'));
  const ok = { ...sf, description: '설명\nAI 음성으로 제작되었습니다.', caption: '캡션 · AI 음성으로 제작' };
  assert.ok(!rules(await lintCampaign(await fixture({ shortform: ok }))).includes('AI표시'));
});

test('민감소재: 대표 개인 서사는 승인 없으면 오류', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '17억 빚에서 다시 일어선 이야기' }, { type: 'cta', title: 'B' }]) });
  assert.ok(rules(await lintCampaign(dir)).includes('민감소재'));
  const ok = await fixture({ meta: { approvals: { ceo_story: '김상현 2026-10-04' } }, cardnews: card([{ type: 'cover', title: '17억 빚에서 다시 일어선 이야기' }, { type: 'cta', title: 'B' }]) });
  assert.ok(!rules(await lintCampaign(ok)).includes('민감소재'));
});

test('승인 잠금: 승인 이후 파일이 바뀌면 발행 차단', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: 'A' }, { type: 'cta', title: 'B' }]) });
  assert.equal((await verifyPublishApproval(dir)).ok, false);
  await saveStatus(dir, { stage: 'publish_approved', approvals: [{ stage: 'publish', by: '테스트', at: 'now', hashes: await fingerprint(dir) }] });
  assert.equal((await verifyPublishApproval(dir)).ok, true);
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(card([{ type: 'cover', title: 'A(수정)' }, { type: 'cta', title: 'B' }])));
  const v = await verifyPublishApproval(dir);
  assert.equal(v.ok, false);
  assert.match(v.reason, /cardnews\.json/);
});

test('승인: 에이전트 세션(FEELM_AGENT=1)에서는 승인 불가', async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: 'A' }, { type: 'cta', title: 'B' }]) });
  const prev = process.env.FEELM_AGENT;
  process.env.FEELM_AGENT = '1';
  try {
    await assert.rejects(approve(dir, { stage: 'plan', by: '테스트' }), /에이전트 세션/);
  } finally {
    if (prev === undefined) delete process.env.FEELM_AGENT; else process.env.FEELM_AGENT = prev;
  }
});

test('TTS 분할: 문장 경계로 길이 제한 이하로 나눈다', () => {
  const text = '첫 문장입니다. '.repeat(40);
  const parts = splitText(text, 100);
  assert.ok(parts.length > 1);
  assert.ok(parts.every(p => p.length <= 100));
  assert.equal(parts.join(' ').replace(/\s+/g, ''), text.replace(/\s+/g, ''));
});

test('렌더러: 카드뉴스 PNG/JPG와 컨택트 시트를 만든다', { timeout: 60000 }, async () => {
  const dir = await fixture({ cardnews: card([{ type: 'cover', title: '테스트 **커버**' }, { type: 'list', title: '목록', items: ['하나', '둘'] }, { type: 'cta', title: '끝' }]) });
  await renderCardnews(dir, { quiet: true });
  const files = await readdir(path.join(dir, 'out', 'cardnews'));
  for (const f of ['01.png', '01.jpg', '03.jpg', 'contact-sheet.jpg']) assert.ok(files.includes(f), f);
});

test('렌더러: 넘치는 텍스트는 오류로 막는다', { timeout: 60000 }, async () => {
  const long = '아주 긴 문장이 계속 이어집니다 '.repeat(60);
  const dir = await fixture({ cardnews: card([{ type: 'text', title: long, body: long }, { type: 'cta', title: '끝' }]) });
  await assert.rejects(renderCardnews(dir, { quiet: true }), /넘친 슬라이드/);
});

test('가상인물: AI 가상인물 추천 장면은 첫 줄에 가상인물 표시 필요', async () => {
  const sf = { scenes: [{ type: 'hook', text: '추천해요', virtual_person: true }], title: 't', description: '좋은 책', caption: '좋은 책', tags: [] };
  assert.ok(rules(await lintCampaign(await fixture({ shortform: sf }))).includes('가상인물'));
  const ok = { ...sf, description: '[가상인물] 좋은 책', caption: '가상인물 · 좋은 책' };
  assert.ok(!rules(await lintCampaign(await fixture({ shortform: ok }))).includes('가상인물'));
});

test('플랫폼: 인스타 API 캐러셀은 10장 초과 불가, 해시태그 5개 초과 불가', async () => {
  const slides = Array.from({ length: 11 }, (_, i) => ({ type: 'text', title: `${i}`, body: 'x' }));
  const r = await lintCampaign(await fixture({ cardnews: card(slides, { hashtags: ['#a', '#b', '#c', '#d', '#e', '#f'] }) }));
  assert.equal(rules(r).filter(x => x === '플랫폼').length, 2);
});
