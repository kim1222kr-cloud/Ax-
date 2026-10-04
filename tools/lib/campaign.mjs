// 캠페인 메타·상태·승인 잠금 공통 로직
// status.json = { stage, approvals: [{stage, by, at, note, lint, hashes}], grants: {quotes|ceo_story|legal: {by, at, ids?, note?}}, published: [] }
// status.json 은 사람(approve.mjs)과 발행 스크립트만 쓴다. 에이전트는 settings deny·훅으로 막혀 있다.
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { readJson, writeJson, exists, sha256File } from './common.mjs';

export const STAGES = ['brief', 'plan_approved', 'draft_approved', 'publish_approved', 'published'];
export const APPROVAL_STAGES = { plan: 'plan_approved', draft: 'draft_approved', publish: 'publish_approved' };
export const GRANT_KEYS = ['quotes', 'ceo_story', 'legal'];

export const stageIndex = s => STAGES.indexOf(s);

export async function loadCampaign(dir) {
  const read = async f => ((await exists(path.join(dir, f))) ? readJson(path.join(dir, f)) : null);
  return {
    dir,
    meta: (await read('campaign.json')) || {},
    cardnews: await read('cardnews.json'),
    shortform: await read('shortform.json'),
    status: await loadStatus(dir),
  };
}

export async function loadStatus(dir) {
  const p = path.join(dir, 'status.json');
  const s = (await exists(p)) ? await readJson(p) : {};
  return { stage: 'brief', approvals: [], grants: {}, published: [], ...s };
}

export async function saveStatus(dir, status) {
  await writeJson(path.join(dir, 'status.json'), status);
}

// 마지막 재오픈 이후의 승인만 유효하다
export function activeApprovals(status) {
  const list = status.approvals || [];
  const lastReopen = list.map(a => a.stage).lastIndexOf('reopen');
  return list.slice(lastReopen + 1);
}

export function latestApproval(status, stage) {
  return [...activeApprovals(status)].reverse().find(a => a.stage === stage) || null;
}

async function walk(dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

async function hashFiles(dir, files) {
  const hashes = {};
  for (const f of files.sort()) {
    if (await exists(f)) hashes[path.relative(dir, f)] = await sha256File(f);
  }
  return hashes;
}

// 산출물 지문(시안·최종 승인 시 잠금 대상)
export async function fingerprint(dir) {
  return hashFiles(dir, [
    ...['campaign.json', 'cardnews.json', 'shortform.json'].map(f => path.join(dir, f)),
    ...(await walk(path.join(dir, 'out'))),
  ]);
}

// 기획 지문(기획 승인 시 기록 — 이후 기획 변경을 감지)
export async function planFingerprint(dir) {
  return hashFiles(dir, ['brief.md', 'campaign.json'].map(f => path.join(dir, f)));
}

export function diffHashes(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter(k => a[k] !== b[k]);
}

// 발행 가능 여부: (재오픈 이후) publish 승인 존재 + 승인 이후 파일 변경 없음
export async function verifyPublishApproval(dir) {
  const status = await loadStatus(dir);
  const approval = latestApproval(status, 'publish');
  if (!approval) return { ok: false, reason: '최종 발행 승인(publish)이 없습니다. 담당자가 별도 터미널에서 `npm run approve -- <캠페인> --stage publish --by <이름>` 으로 승인해야 합니다.' };
  const changed = diffHashes(approval.hashes, await fingerprint(dir));
  if (changed.length) return { ok: false, reason: `승인 이후 파일이 바뀌었습니다: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? ' …' : ''}. 다시 승인받아야 합니다.` };
  return { ok: true, approval };
}

// 승인 상태 요약 (읽기 전용: npm run check:approval)
export async function approvalReport(dir) {
  const status = await loadStatus(dir);
  const now = await fingerprint(dir);
  const plan = latestApproval(status, 'plan');
  const draft = latestApproval(status, 'draft');
  const publish = latestApproval(status, 'publish');
  return {
    stage: status.stage,
    grants: Object.keys(status.grants || {}),
    plan: plan ? { by: plan.by, at: plan.at, changed_since: plan.plan_hashes ? diffHashes(plan.plan_hashes, await planFingerprint(dir)) : null } : null,
    draft: draft ? { by: draft.by, at: draft.at, changed_since: diffHashes(draft.hashes, now) } : null,
    publish: publish ? { by: publish.by, at: publish.at, changed_since: diffHashes(publish.hashes, now) } : null,
    published: status.published || [],
  };
}
