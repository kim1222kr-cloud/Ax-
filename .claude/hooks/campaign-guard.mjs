#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit) 훅 — 파일 편집 도구로 승인·잠금·정책을 우회하지 못하게 막는다.
// 등록: .claude/settings.json hooks.PreToolUse 에 matcher "Edit|Write|MultiEdit" 로 추가 (docs/setup.md 참고)
//  - status.json, .env, 보호 경로(data/ brand/ templates/ tools/ .claude/) 쓰기 차단
//  - 최종 승인(publish_approved) 이후 campaign.json·cardnews.json·shortform.json·out/** 쓰기 차단
//  - 기획 승인 이후 기획 플래그(format_id, risk_tier, sponsored, author_collab, deliverables, featured_books, book) 변경 차단
//  - sponsored true→false 변경은 항상 차단 / campaign.json 에 approvals 키 금지(승인은 status.json)
//  - 기획 승인 이후 review/plan-snapshot.json 쓰기 차단 / 편집부 grant(quotes) 이후 assets/quotes.json 쓰기 차단
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCKED_FLAGS = ['format_id', 'risk_tier', 'sponsored', 'author_collab', 'deliverables', 'featured_books', 'book'];
const STAGES = ['brief', 'plan_approved', 'draft_approved', 'publish_approved', 'published'];

const readJsonSafe = p => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

function proposedContent(toolName, input, abs) {
  if (toolName === 'Write') return input.content ?? '';
  let cur = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
  const edits = toolName === 'MultiEdit' ? input.edits || [] : [input];
  for (const e of edits) {
    if (e.old_string === undefined) continue;
    cur = e.replace_all ? cur.split(e.old_string).join(e.new_string ?? '') : cur.replace(e.old_string, e.new_string ?? '');
  }
  return cur;
}

export function check(toolName, input, root = ROOT) {
  const fp = input?.file_path;
  if (!fp) return null;
  const abs = path.resolve(root, fp);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (rel.startsWith('..')) return null; // 리포 밖은 관여하지 않음

  if (/(^|\/)status\.json$/.test(rel)) return 'status.json(승인·발행 기록)은 사람(approve)과 발행 스크립트만 씁니다.';
  if (/^\.env(\.|$)/.test(rel) && !/example/.test(rel)) return '.env 는 에이전트가 다룰 수 없습니다.';
  if (/^(data|brand|templates|tools|\.claude)\//.test(rel)) return `${rel.split('/')[0]}/ 는 보호 경로입니다. 변경 제안은 content/campaigns/_planning/registry-proposals.md 에 적고 사람이 반영합니다.`;

  const m = rel.match(/^content\/campaigns\/([^/_][^/]*)\/(.+)$/);
  if (!m) return null;
  const dir = path.join(root, 'content', 'campaigns', m[1]);
  const file = m[2];
  const status = readJsonSafe(path.join(dir, 'status.json')) || { stage: 'brief', grants: {} };
  const stage = STAGES.indexOf(status.stage);

  if (stage >= STAGES.indexOf('publish_approved') && (/^(campaign|cardnews|shortform)\.json$/.test(file) || file.startsWith('out/'))) {
    return '최종 승인으로 잠긴 캠페인입니다. 수정하면 발행이 막힙니다. 재작업은 담당자가 --reopen 한 뒤에 하세요.';
  }
  if (file === 'review/plan-snapshot.json' && stage >= STAGES.indexOf('plan_approved')) {
    return '기획 승인 이후에는 plan-snapshot.json 을 바꿀 수 없습니다. 기획 변경은 재기획으로 처리합니다.';
  }
  if (file === 'assets/quotes.json' && status.grants?.quotes) {
    return '편집부가 인용을 확인(grant)한 뒤에는 quotes.json 을 바꿀 수 없습니다.';
  }
  if (file === 'campaign.json') {
    const next = (() => { try { return JSON.parse(proposedContent(toolName, input, path.join(dir, file))); } catch { return undefined; } })();
    if (next === undefined) return 'campaign.json 이 올바른 JSON 이 아닙니다.';
    const cur = readJsonSafe(path.join(dir, file)) || {};
    if (Object.prototype.hasOwnProperty.call(next, 'approvals')) return 'campaign.json 에 approvals 를 쓸 수 없습니다. 승인·grant 는 status.json 에 사람이 기록합니다.';
    if (cur.sponsored === true && next.sponsored !== true) return 'sponsored(광고 표기 대상)를 해제할 수 없습니다. 리드가 확인한 뒤 사람이 직접 바꿉니다.';
    if (stage >= STAGES.indexOf('plan_approved')) {
      const changed = LOCKED_FLAGS.filter(k => JSON.stringify(cur[k] ?? null) !== JSON.stringify(next[k] ?? null));
      if (changed.length) return `기획 승인 이후 기획 플래그를 바꿀 수 없습니다: ${changed.join(', ')}. 재기획이 필요합니다.`;
    }
  }
  return null;
}

function main() {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  const reason = check(input.tool_name, input.tool_input || {});
  if (reason) { process.stderr.write(`[캠페인 가드] ${reason}\n`); process.exit(2); }
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
