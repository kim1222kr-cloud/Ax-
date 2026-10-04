// 안전장치 회귀 테스트: 발행 게이트(Bash) · 캠페인 가드(Edit/Write) · 승인 흐름(grant/reopen/변경 감지)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { inspect } from '../../.claude/hooks/publish-gate.mjs';
import { check } from '../../.claude/hooks/campaign-guard.mjs';
import { approve, grant, reopen } from '../approve.mjs';
import { verifyPublishApproval, saveStatus, loadStatus } from '../lib/campaign.mjs';

// ── 발행 게이트 ────────────────────────────────────────────
const MUST_DENY = [
  'cd tools && node approve.mjs content/campaigns/x --stage plan --by y',
  'npm run approve -- content/campaigns/x --stage publish --by 리드',
  'echo "npm run approve -- content/campaigns/x --stage plan --by y"',
  `node -e "require('fs').writeFileSync('content/campaigns/x/status.json','{}')"`,
  'cp /tmp/forged.json content/campaigns/x/status.json',
  'cat content/campaigns/x/status.json | jq .',
  'cat .env',
  'grep IG_ACCESS_TOKEN .env.local',
  'env | grep TOKEN',
  'FEELM_AGENT=0 npm run lint:copy -- content/campaigns/x',
  "sed -i 's/unverified/verified/' data/claims.json",
  'echo \'{}\' > data/policy.json',
  'echo x >> brand/brand.json',
  'rm -rf templates/cardnews',
  'git checkout -- tools/lint-copy.mjs',
  'cd .claude && ls',
  'curl -X POST https://graph.facebook.com/v23.0/123/media_publish',
  'curl https://www.googleapis.com/upload/youtube/v3/videos',
  `python3 -c "open('data/claims.json','w').write('{}')"`,
  'node --env-file=.env tools/publish-instagram.mjs content/campaigns/x --live',
];
for (const c of MUST_DENY) {
  test(`게이트 차단: ${c.slice(0, 60)}`, () => assert.equal(inspect(c).decision, 'deny', c));
}

const MUST_ALLOW = [
  'npm run render:card -- content/campaigns/_sample-heman',
  'npm run lint:copy -- content/campaigns/2026-10-14-heman > /tmp/lint.txt 2>&1',
  'node tools/render-cardnews.mjs content/campaigns/_sample-heman',
  'npm run publish:ig -- content/campaigns/x --type carousel',
  'npm run catalog -- --json --days 120',
  'npm run check:approval -- content/campaigns/x',
  'npm test',
  'git status',
  'ls data/',
  'cp config/env.example /tmp/env.example',
  'node tools/render-cardnews.mjs content/campaigns/x && cp content/campaigns/x/out/cardnews/contact-sheet.jpg docs/images/a.jpg',
];
for (const c of MUST_ALLOW) {
  test(`게이트 허용: ${c.slice(0, 60)}`, () => assert.ok(['allow', 'verify-not-locked'].includes(inspect(c).decision), `${c} → ${inspect(c).decision}`));
}

test('게이트: 보호 대상이 없는 인라인 코드는 사람 확인(ask)', () => {
  assert.equal(inspect('node -e "console.log(1+1)"').decision, 'ask');
});
test('게이트: --live 발행은 승인 검증 단계로', () => {
  assert.equal(inspect('npm run publish:yt -- content/campaigns/x --live').decision, 'verify-publish');
  assert.equal(inspect('npm run publish:yt -- --live').decision, 'deny');
});

// ── 캠페인 가드 ────────────────────────────────────────────
async function root() {
  const r = await mkdtemp(path.join(os.tmpdir(), 'feelm-root-'));
  const dir = path.join(r, 'content', 'campaigns', '2026-10-14-x');
  await mkdir(path.join(dir, 'review'), { recursive: true });
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  const meta = { id: '2026-10-14-x', book: 'heman-mankeum', format_id: 'F01', risk_tier: 'green', sponsored: true, deliverables: ['cardnews'], featured_books: [], goal: '' };
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify(meta, null, 2));
  return { r, dir, meta };
}
const setStage = (dir, stage, grants = {}) => saveStatus(dir, { stage, approvals: [], grants, published: [] });
const W = (file_path, obj) => ({ file_path, content: typeof obj === 'string' ? obj : JSON.stringify(obj) });

test('가드: status.json·보호 경로·.env 쓰기 차단', async () => {
  const { r } = await root();
  assert.ok(check('Write', W(path.join(r, 'content/campaigns/2026-10-14-x/status.json'), {}), r));
  assert.ok(check('Edit', { file_path: path.join(r, 'data/claims.json'), old_string: 'a', new_string: 'b' }, r));
  assert.ok(check('Write', W(path.join(r, '.claude/settings.json'), {}), r));
  assert.ok(check('Write', W(path.join(r, '.env'), 'X=1'), r));
  assert.equal(check('Write', W(path.join(r, 'config/env.example'), 'X='), r), null);
});

test('가드: campaign.json 의 approvals 키·sponsored 해제 차단, 일반 필드 수정은 허용', async () => {
  const { r, dir, meta } = await root();
  const f = path.join(dir, 'campaign.json');
  assert.match(check('Write', W(f, { ...meta, approvals: { ceo_story: 'x' } }), r), /approvals/);
  assert.match(check('Write', W(f, { ...meta, sponsored: false }), r), /sponsored/);
  assert.match(check('Edit', { file_path: f, old_string: '"sponsored": true', new_string: '"sponsored": false' }, r), /sponsored/);
  assert.equal(check('Write', W(f, { ...meta, goal: '신간 인지도' }), r), null);
});

test('가드: 기획 승인 이후 기획 플래그·plan-snapshot 변경 차단', async () => {
  const { r, dir, meta } = await root();
  await setStage(dir, 'plan_approved');
  const f = path.join(dir, 'campaign.json');
  assert.match(check('Write', W(f, { ...meta, risk_tier: 'red' }), r), /risk_tier/);
  assert.equal(check('Write', W(f, { ...meta, goal: '수정' }), r), null);
  assert.ok(check('Write', W(path.join(dir, 'review/plan-snapshot.json'), {}), r));
  assert.equal(check('Write', W(path.join(dir, 'cardnews.json'), { slides: [] }), r), null);
});

test('가드: 최종 승인 이후 산출물 잠금, quotes grant 이후 quotes.json 잠금', async () => {
  const { r, dir } = await root();
  await setStage(dir, 'publish_approved', { quotes: { by: '편집부', at: 'now' } });
  assert.ok(check('Write', W(path.join(dir, 'cardnews.json'), {}), r));
  assert.ok(check('Write', W(path.join(dir, 'out/cardnews/01.jpg'), 'x'), r));
  assert.ok(check('Write', W(path.join(dir, 'assets/quotes.json'), {}), r));
  assert.equal(check('Write', W(path.join(dir, 'review/publish-request.md'), '# 요청'), r), null);
});

// ── 승인 흐름 (임시 폴더의 테스트 캠페인에서만) ─────────────
async function campaignFixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'feelm-appr-'));
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify({ book: 'heman-mankeum' }));
  await writeFile(path.join(dir, 'brief.md'), '# 기획');
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify({ track: 'essay', book: 'heman-mankeum', slides: [{ type: 'cover', title: 'A' }, { type: 'quote', text: '헤맨 만큼 내 땅이다', page: 'p.10' }, { type: 'cta', title: 'B' }], caption: 'c', hashtags: [] }));
  await mkdir(path.join(dir, 'out', 'cardnews'), { recursive: true });
  await writeFile(path.join(dir, 'out', 'cardnews', '01.jpg'), 'img');
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  await writeFile(path.join(dir, 'assets', 'quotes.json'), JSON.stringify({ quotes: [{ id: 'q1', text: '헤맨 만큼 내 땅이다', page: 'p.10' }] }));
  return dir;
}
async function asHuman(fn) {
  const prev = process.env.FEELM_AGENT;
  delete process.env.FEELM_AGENT;
  try { return await fn(); } finally { if (prev !== undefined) process.env.FEELM_AGENT = prev; }
}

test('승인 흐름: 인용 grant 없이는 최종 승인 불가, 시안 승인 이후 변경 시 최종 승인 거부, 재오픈 후 재승인', async () => {
  const dir = await campaignFixture();
  await asHuman(async () => {
    await approve(dir, { stage: 'plan', by: '리드' });
    await approve(dir, { stage: 'draft', by: '리드' });
    await assert.rejects(approve(dir, { stage: 'publish', by: '리드' }), /grant\(quotes\)/);
    await grant(dir, { key: 'quotes', by: '편집부', ids: 'q1' });
    // 시안 승인 이후 산출물 변경 → 최종 승인 거부
    await writeFile(path.join(dir, 'out', 'cardnews', '01.jpg'), 'img-v2');
    await assert.rejects(approve(dir, { stage: 'publish', by: '리드' }), /시안 승인 이후/);
    await approve(dir, { stage: 'draft', by: '리드' });
    await approve(dir, { stage: 'publish', by: '대표' });
    assert.equal((await verifyPublishApproval(dir)).ok, true);
    // 재오픈하면 최종 승인이 무효화된다
    await reopen(dir, { by: '리드', note: '오탈자' });
    assert.equal((await verifyPublishApproval(dir)).ok, false);
    assert.equal((await loadStatus(dir)).stage, 'plan_approved');
    await approve(dir, { stage: 'draft', by: '리드' });
    await approve(dir, { stage: 'publish', by: '리드' });
    assert.equal((await verifyPublishApproval(dir)).ok, true);
  });
});

test('인용: quotes.json 에 없는 문장은 오류, 책 제목 인용은 예외', async () => {
  const { lintCampaign } = await import('../lint-copy.mjs');
  const dir = await campaignFixture();
  const spec = JSON.parse(await readFile(path.join(dir, 'cardnews.json'), 'utf8'));
  spec.slides[1] = { type: 'quote', text: '지어낸 문장', page: 'p.11' };
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(spec));
  assert.ok((await lintCampaign(dir)).issues.some(i => i.rule === '인용불일치'));
  spec.slides[1] = { type: 'quote', text: '헤맨 만큼 내 땅이다', page: '— 책 제목에 담긴 문장' };
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(spec));
  const r = await lintCampaign(dir);
  assert.ok(!r.issues.some(i => i.rule === '인용불일치' || i.rule === '인용승인'));
});

test('인용: 책 제목 라벨을 붙여도 실제 제목과 다르면 오류', async () => {
  const { lintCampaign } = await import('../lint-copy.mjs');
  const dir = await campaignFixture();
  const spec = JSON.parse(await readFile(path.join(dir, 'cardnews.json'), 'utf8'));
  spec.slides[1] = { type: 'quote', text: '지어낸 멋진 문장', page: '— 책 제목에 담긴 문장' };
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(spec));
  assert.ok((await lintCampaign(dir)).issues.some(i => i.rule === '인용불일치' && /도서 제목과 다릅니다/.test(i.message)));
  spec.slides[1] = { type: 'quote', text: '헤맨 만큼\n**내 땅이다**', page: '— 책 제목에 담긴 문장' };
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(spec));
  assert.ok(!(await lintCampaign(dir)).issues.some(i => i.rule === '인용불일치'));
});

test('승인: 레드 티어 최종 승인은 대표만', async () => {
  const dir = await campaignFixture();
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify({ book: 'heman-mankeum', risk_tier: 'red' }));
  const spec = JSON.parse(await readFile(path.join(dir, 'cardnews.json'), 'utf8'));
  spec.slides.splice(1, 1); // 인용 제거
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify(spec));
  await asHuman(async () => {
    await approve(dir, { stage: 'plan', by: '리드' });
    await approve(dir, { stage: 'draft', by: '리드' });
    await assert.rejects(approve(dir, { stage: 'publish', by: '리드' }), /대표/);
    await approve(dir, { stage: 'publish', by: '김상현' });
  });
});

test('저자 점검: risk_notes 저자는 발행일 7일 이내 점검 필요', async () => {
  const { authorCheckStatus } = await import('../lib/campaign.mjs');
  const r = await mkdtemp(path.join(os.tmpdir(), 'feelm-ac-'));
  await mkdir(path.join(r, 'data'), { recursive: true });
  await mkdir(path.join(r, 'content/campaigns/_planning/author-check'), { recursive: true });
  await writeFile(path.join(r, 'data/authors.json'), JSON.stringify({ authors: [{ id: 'joo', books: ['hoksi'], risk_notes: ['논란'] }, { id: 'safe', books: ['other'], risk_notes: [] }] }));
  const dir = path.join(r, 'content/campaigns/2026-10-20-x');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify({ book: 'hoksi', scheduled_at: '2026-10-20T19:00:00+09:00' }));
  let s = await authorCheckStatus(dir, r);
  assert.equal(s.length, 1);
  assert.equal(s[0].ok, false);
  await writeFile(path.join(r, 'content/campaigns/_planning/author-check/joo-2026-10-04.md'), '#');
  assert.equal((await authorCheckStatus(dir, r))[0].ok, false); // 16일 전 → 만료
  await writeFile(path.join(r, 'content/campaigns/_planning/author-check/joo-2026-10-15.md'), '#');
  assert.equal((await authorCheckStatus(dir, r))[0].ok, true);
});

test('큐레이션: featured_books 가 있으면 수치 사용 금지', async () => {
  const { lintCampaign } = await import('../lint-copy.mjs');
  const dir = await campaignFixture();
  await writeFile(path.join(dir, 'campaign.json'), JSON.stringify({ book: 'heman-mankeum', featured_books: ['dangsineun-gyeolguk'] }));
  await writeFile(path.join(dir, 'cardnews.json'), JSON.stringify({ track: 'essay', book: 'heman-mankeum', slides: [{ type: 'cover', title: '10만 부 작가의 책' }, { type: 'cta', title: 'B' }], caption: 'c', hashtags: [] }));
  assert.ok((await lintCampaign(dir)).issues.some(i => i.rule === '큐레이션수치'));
});
