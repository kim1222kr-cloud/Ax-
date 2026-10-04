#!/usr/bin/env node
// 사람 승인(HITL) 기록. 에이전트는 이 스크립트를 실행하지 않는다 — 담당자가 직접 실행한다.
// 사용법: npm run approve -- content/campaigns/<id> --stage plan|draft|publish --by "이름" [--note "메모"]
//   plan    : 기획안(brief.md/plan.md) 승인 → 제작 착수 가능
//   draft   : 시안(렌더링 결과) 승인 → 최종 검수 진행
//   publish : 최종 발행 승인 → 산출물 지문(SHA-256)을 잠금. 이후 파일이 바뀌면 발행 차단
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { parseArgs, campaignDir } from './lib/common.mjs';
import { loadStatus, saveStatus, fingerprint, APPROVAL_STAGES } from './lib/campaign.mjs';
import { lintCampaign } from './lint-copy.mjs';

export async function approve(dir, { stage, by, note }) {
  if (!APPROVAL_STAGES[stage]) throw new Error(`--stage 는 ${Object.keys(APPROVAL_STAGES).join(' | ')} 중 하나`);
  if (!by || by === true) throw new Error('--by "승인자 이름" 이 필요합니다.');
  // .claude/settings.json 의 env 가 에이전트 세션에 FEELM_AGENT=1 을 넣는다 (+ deny 규칙·훅으로 이중 차단)
  if (process.env.FEELM_AGENT === '1') {
    throw new Error('에이전트 세션에서는 승인할 수 없습니다. 담당자가 터미널에서 직접 실행하세요.');
  }
  const status = await loadStatus(dir);
  const order = Object.keys(APPROVAL_STAGES);
  const prev = order[order.indexOf(stage) - 1];
  if (prev && !(status.approvals || []).some(a => a.stage === prev)) {
    throw new Error(`'${prev}' 승인이 먼저 필요합니다.`);
  }
  let lint = null;
  if (stage !== 'plan') {
    lint = await lintCampaign(dir);
    if (lint.errors) throw new Error(`검수 오류 ${lint.errors}건이 남아 있어 승인할 수 없습니다. review/lint.json 확인.`);
  }
  const entry = {
    stage,
    by,
    at: new Date().toISOString(),
    note: note && note !== true ? note : undefined,
    lint: lint ? { errors: lint.errors, warnings: lint.warnings } : undefined,
    hashes: stage === 'plan' ? undefined : await fingerprint(dir),
  };
  status.approvals = [...(status.approvals || []), entry];
  status.stage = APPROVAL_STAGES[stage];
  await saveStatus(dir, status);
  return entry;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const dir = campaignDir(args._[0]);
  approve(dir, { stage: args.stage, by: args.by, note: args.note })
    .then(e => console.log(`✔ ${path.basename(dir)}: '${e.stage}' 승인 (${e.by}, ${e.at})${e.hashes ? ` · 파일 ${Object.keys(e.hashes).length}개 잠금` : ''}${e.lint?.warnings ? ` · 경고 ${e.lint.warnings}건 확인 필요` : ''}`))
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
