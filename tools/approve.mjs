#!/usr/bin/env node
// 사람 승인(HITL) 기록. 에이전트는 이 스크립트를 실행할 수 없다(FEELM_AGENT=1 env · settings deny · PreToolUse 훅).
// Claude Code 밖의 별도 터미널에서 담당자가 직접 실행한다.
//
//   npm run approve -- content/campaigns/<id> --stage plan|draft|publish --by "이름" [--note "메모"]
//     plan    : 기획안(brief.md·campaign.json) 승인 → 제작 착수. 기획 지문 기록
//     draft   : 시안(렌더 결과) 승인 → lint 오류 0 재확인, 산출물 지문 기록
//     publish : 최종 발행 승인 → 시안 승인 이후 변경이 없어야 함, 산출물 SHA-256 잠금
//   npm run approve -- content/campaigns/<id> --grant quotes|ceo_story|legal --by "이름" [--ids q1,q2] [--note "메모"]
//     quotes   : 편집부가 인용 원문·쪽수 확인 (assets/quotes.json 의 id)
//     ceo_story: 대표 개인 서사·대표 출연 사용 승인 (대표 본인)
//     legal    : 업계 사건 언급 등 법무 검토 완료
//   npm run approve -- content/campaigns/<id> --reopen --by "이름" --note "사유"
//     최종 승인 이후 재작업이 필요할 때. 기존 시안·최종 승인을 무효화하고 stage 를 plan_approved 로 되돌린다.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { parseArgs, campaignDir, exists, readJson, ROOT } from './lib/common.mjs';
import { loadStatus, saveStatus, fingerprint, planFingerprint, diffHashes, latestApproval, APPROVAL_STAGES, GRANT_KEYS } from './lib/campaign.mjs';
import { lintCampaign } from './lint-copy.mjs';

function guard(by) {
  if (!by || by === true) throw new Error('--by "승인자 이름" 이 필요합니다.');
  // .claude/settings.json 의 env 가 에이전트 세션에 FEELM_AGENT=1 을 넣는다 (+ deny 규칙·훅으로 이중 차단)
  if (process.env.FEELM_AGENT === '1') {
    throw new Error('에이전트 세션에서는 승인할 수 없습니다. 담당자가 Claude Code 밖의 터미널에서 직접 실행하세요.');
  }
}

export async function approve(dir, { stage, by, note }) {
  if (!APPROVAL_STAGES[stage]) throw new Error(`--stage 는 ${Object.keys(APPROVAL_STAGES).join(' | ')} 중 하나`);
  guard(by);
  if (!(await exists(path.join(dir, 'campaign.json')))) throw new Error(`캠페인이 아닙니다: ${dir}`);
  const status = await loadStatus(dir);
  const order = Object.keys(APPROVAL_STAGES);
  const prev = order[order.indexOf(stage) - 1];
  const prevApproval = prev ? latestApproval(status, prev) : null;
  if (prev && !prevApproval) throw new Error(`'${prev}' 승인이 먼저 필요합니다.`);

  let lint = null;
  let hashes;
  let plan_hashes;
  if (stage === 'plan') {
    plan_hashes = await planFingerprint(dir);
  } else {
    lint = await lintCampaign(dir);
    if (lint.errors) throw new Error(`검수 오류 ${lint.errors}건이 남아 있어 승인할 수 없습니다. review/lint.json 확인.`);
    hashes = await fingerprint(dir);
    if (!Object.keys(hashes).some(k => k.startsWith('out/'))) throw new Error('렌더 결과(out/)가 없습니다. 시안을 먼저 만드세요.');
  }
  if (stage === 'publish') {
    // 레드 티어 최종 승인은 대표만 (data/approvers.json ceo.name)
    const meta = await readJson(path.join(dir, 'campaign.json'));
    const approvers = (await exists(path.join(ROOT, 'data', 'approvers.json'))) ? await readJson(path.join(ROOT, 'data', 'approvers.json')) : {};
    if (meta.risk_tier === 'red' && approvers.ceo?.name && by !== approvers.ceo.name) {
      throw new Error(`레드 티어 캠페인의 최종 승인은 대표(${approvers.ceo.name})만 할 수 있습니다.`);
    }
    if (lint.issues.some(i => i.rule === '인용승인' && i.where === 'campaign')) {
      throw new Error('본문 인용이 있는데 편집부 grant(quotes)가 없습니다. 먼저 `--grant quotes --by <편집부> --ids …` 를 기록하세요.');
    }
    const changed = diffHashes(prevApproval.hashes, hashes);
    if (changed.length) throw new Error(`시안 승인 이후 바뀐 파일이 있습니다: ${changed.slice(0, 8).join(', ')}. 시안(draft)을 다시 승인한 뒤 최종 승인하세요.`);
  }
  const entry = {
    stage,
    by,
    at: new Date().toISOString(),
    note: note && note !== true ? note : undefined,
    lint: lint ? { errors: lint.errors, warnings: lint.warnings } : undefined,
    plan_hashes,
    hashes,
  };
  status.approvals = [...(status.approvals || []), entry];
  status.stage = APPROVAL_STAGES[stage];
  await saveStatus(dir, status);
  return entry;
}

export async function grant(dir, { key, by, ids, note }) {
  if (!GRANT_KEYS.includes(key)) throw new Error(`--grant 는 ${GRANT_KEYS.join(' | ')} 중 하나`);
  guard(by);
  const status = await loadStatus(dir);
  if (status.stage === 'publish_approved' || status.stage === 'published') {
    throw new Error('최종 승인 이후에는 grant 를 추가할 수 없습니다. 먼저 --reopen 하세요.');
  }
  status.grants = {
    ...(status.grants || {}),
    [key]: {
      by,
      at: new Date().toISOString(),
      ids: ids && ids !== true ? String(ids).split(',').map(s => s.trim()).filter(Boolean) : undefined,
      note: note && note !== true ? note : undefined,
    },
  };
  await saveStatus(dir, status);
  return status.grants[key];
}

export async function reopen(dir, { by, note }) {
  guard(by);
  if (!note || note === true) throw new Error('--note "재오픈 사유" 가 필요합니다.');
  const status = await loadStatus(dir);
  if (!latestApproval(status, 'plan')) throw new Error('기획 승인 전에는 재오픈할 대상이 없습니다.');
  const planEntry = latestApproval(status, 'plan');
  status.approvals = [...status.approvals, { stage: 'reopen', by, at: new Date().toISOString(), note }, { ...planEntry, at: planEntry.at, carried_over: true }];
  status.stage = 'plan_approved';
  await saveStatus(dir, status);
  return status;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const dir = campaignDir(a._[0]);
  const name = path.basename(dir);
  // --by 표기가 승인자 명단에 없으면 경고(명단이 비어 있으면 채우라고 안내)
  readJson(path.join(ROOT, 'data', 'approvers.json')).then(ap => {
    const names = Object.values(ap).map(v => v?.name).filter(Boolean);
    if (a.by && a.by !== true && !names.includes(a.by)) console.warn(`⚠️ '${a.by}' 는 data/approvers.json 명단에 없습니다${names.length ? '' : '(명단이 비어 있음 — 이름을 채워 주세요)'}.`);
  }).catch(() => {});
  const run = a.grant
    ? grant(dir, { key: a.grant, by: a.by, ids: a.ids, note: a.note }).then(g => `✔ ${name}: grant '${a.grant}' 기록 (${g.by}, ${g.at})${g.ids ? ` · ids ${g.ids.join(',')}` : ''}`)
    : a.reopen
      ? reopen(dir, { by: a.by, note: a.note }).then(() => `✔ ${name}: 재오픈 — 시안·최종 승인이 무효화되었습니다. stage=plan_approved`)
      : approve(dir, { stage: a.stage, by: a.by, note: a.note }).then(e => `✔ ${name}: '${e.stage}' 승인 (${e.by}, ${e.at})${e.hashes ? ` · 파일 ${Object.keys(e.hashes).length}개 잠금` : ''}${e.lint?.warnings ? ` · 경고 ${e.lint.warnings}건 확인 필요` : ''}`);
  run.then(msg => console.log(msg)).catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
