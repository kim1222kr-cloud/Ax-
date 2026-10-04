// 캠페인 메타·상태·승인 잠금 공통 로직
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { readJson, writeJson, exists, sha256File } from './common.mjs';

export const STAGES = ['brief', 'plan_approved', 'draft_approved', 'publish_approved', 'published'];
export const APPROVAL_STAGES = { plan: 'plan_approved', draft: 'draft_approved', publish: 'publish_approved' };

export async function loadCampaign(dir) {
  const metaPath = path.join(dir, 'campaign.json');
  const meta = (await exists(metaPath)) ? await readJson(metaPath) : {};
  const cardnews = (await exists(path.join(dir, 'cardnews.json'))) ? await readJson(path.join(dir, 'cardnews.json')) : null;
  const shortform = (await exists(path.join(dir, 'shortform.json'))) ? await readJson(path.join(dir, 'shortform.json')) : null;
  return { dir, meta, cardnews, shortform };
}

export async function loadStatus(dir) {
  const p = path.join(dir, 'status.json');
  return (await exists(p)) ? readJson(p) : { stage: 'brief', approvals: [], published: [] };
}

export async function saveStatus(dir, status) {
  await writeJson(path.join(dir, 'status.json'), status);
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

// 승인 시점의 산출물 지문. 승인 후 파일이 바뀌면 발행이 막힌다.
export async function fingerprint(dir) {
  const files = [
    ...['campaign.json', 'cardnews.json', 'shortform.json'].map(f => path.join(dir, f)),
    ...(await walk(path.join(dir, 'out'))),
  ];
  const hashes = {};
  for (const f of files.sort()) {
    if (await exists(f)) hashes[path.relative(dir, f)] = await sha256File(f);
  }
  return hashes;
}

export function diffHashes(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter(k => a[k] !== b[k]);
}

// 발행 가능 여부: publish 승인 존재 + 승인 이후 파일 변경 없음
export async function verifyPublishApproval(dir) {
  const status = await loadStatus(dir);
  const approval = [...(status.approvals || [])].reverse().find(a => a.stage === 'publish');
  if (!approval) return { ok: false, reason: '최종 발행 승인(publish)이 없습니다. 사람이 `npm run approve -- <캠페인> --stage publish --by <이름>` 으로 승인해야 합니다.' };
  const now = await fingerprint(dir);
  const changed = diffHashes(approval.hashes, now);
  if (changed.length) return { ok: false, reason: `승인 이후 파일이 바뀌었습니다: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? ' …' : ''}. 다시 승인받아야 합니다.` };
  return { ok: true, approval };
}
