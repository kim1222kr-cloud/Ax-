#!/usr/bin/env node
// PreToolUse(Bash) 훅 — 에이전트 팀의 안전장치. exit 2 = 차단(stderr 가 에이전트에게 전달됨)
//  (1) 승인 기록·승인 상태 파일(status.json)·FEELM_AGENT 조작 차단
//  (2) .env(비밀값) 접근 차단
//  (3) 플랫폼 API 직접 호출 차단 (발행은 publish 스크립트로만)
//  (4) 보호 경로(data/ brand/ templates/ tools/ .claude/)에 대한 셸 쓰기 차단
//  (5) 인라인 코드 실행(node -e, python -c …)은 보호 대상이 보이면 차단, 아니면 사람에게 확인(ask)
//  (6) --live 발행은 최종 승인 + 승인 후 무변경일 때만
//  (7) 최종 승인된 캠페인의 재렌더 차단(승인 잠금 보호)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function inspect(cmd) {
  const c = String(cmd || '');
  if (!c.trim()) return { decision: 'allow' };
  const deny = reason => ({ decision: 'deny', reason });

  // (1) 승인은 사람만. 명령 어디에 있든(인용부호·echo 포함) 막는다
  if (/approve\.mjs|npm\s+(run\s+)?approve\b|run-script\s+approve/.test(c)) {
    return deny('승인 기록(approve)은 담당자만 할 수 있습니다. 승인 요청서에 명령을 적어 사람에게 넘기세요.');
  }
  if (/status\.json/.test(c)) {
    return deny('status.json(승인·발행 기록)은 셸로 다룰 수 없습니다. 읽기는 Read 도구나 npm run check:approval 을 쓰세요.');
  }
  if (/FEELM_AGENT/.test(c)) return deny('FEELM_AGENT 환경변수는 조작할 수 없습니다.');

  // (2) 비밀값
  if (/(^|[\s'"=:/<])\.env(?![\w.-]*example)(\.[\w-]+)?(?=$|[\s'";|&)>])/.test(c) || /--env-file/.test(c) || /\b(printenv|env)\s*($|[|;&>])/.test(c)) {
    return deny('.env·환경변수 덤프는 에이전트가 읽을 수 없습니다. npm run 스크립트가 알아서 불러옵니다.');
  }

  // (3) 플랫폼 API 직접 호출
  if (/graph\.(facebook|instagram)\.com|googleapis\.com\/(upload|youtube)|youtube\/v3\/videos|open\.tiktokapis\.com|oauth2\.googleapis\.com/.test(c)) {
    return deny('플랫폼 API를 직접 호출할 수 없습니다. npm run publish:ig / publish:yt 를 사용하세요.');
  }

  // (4) 보호 경로 셸 쓰기
  const P = '(\\.\\/)?(data|brand|templates|tools|\\.claude)\\/';
  const protectedPath = new RegExp(`(^|[\\s'"=(/])${P}`);
  const redirectInto = new RegExp(`>{1,2}\\s*['"]?${P}`);
  const mutating = /(\btee\b|\bcp\b|\bmv\b|\bsed\s+(-[a-zA-Z]*i|--in-place)|\brm\b|\bln\b|\brsync\b|\btruncate\b|\bchmod\b|\bdd\b|\binstall\b|\bunlink\b|\bgit\s+(checkout|restore|reset|apply|stash)\b)/;
  // 명령 구간(&&, ||, ;, |, 줄바꿈)별로 판단: 같은 구간 안에 '변경 동작 + 보호 경로'가 있을 때만 차단
  const segments = c.split(/&&|\|\||[;|\n]/);
  if (redirectInto.test(c) || segments.some(s => protectedPath.test(s) && mutating.test(s))) {
    return deny('data/·brand/·templates/·tools/·.claude/ 는 셸로 수정할 수 없습니다(정책·등록부·도구 보호). 변경 제안은 _planning/registry-proposals.md 에 적으세요.');
  }
  if (/\bcd\s+(\.\/)?(tools|data|brand|templates|\.claude)\b/.test(c)) {
    return deny('보호 폴더로 cd 한 뒤 실행할 수 없습니다. 루트에서 npm run 스크립트를 쓰세요.');
  }

  // (5) 인라인 코드 실행
  const inline = /\b(node|nodejs|bun|deno)\s+(-e|--eval|-p|--print|eval)\b|\bpython3?\s+-c\b|\bperl\s+-e\b|\bruby\s+-e\b|\bosascript\b/;
  if (inline.test(c)) {
    if (/status|approv|\.env|claims|policy|grants|data\/|brand\/|tools\/|\.claude/.test(c)) {
      return deny('인라인 코드로 보호 대상(승인·등록부·정책·도구)을 다룰 수 없습니다.');
    }
    return { decision: 'ask', reason: '인라인 코드 실행입니다. 사람이 내용을 확인한 뒤 허용하세요.' };
  }

  const m = c.match(/content\/campaigns\/[^\s"';&|)]+/);
  const campaign = m ? path.resolve(ROOT, m[0].replace(/\/+$/, '')) : null;

  // (6) 실발행
  const isPublish = /(npm\s+run\s+publish:(ig|yt)|tools\/publish-(instagram|youtube)\.mjs)/.test(c);
  if (isPublish && /--live\b/.test(c)) {
    if (!campaign) return deny('--live 발행에는 캠페인 경로(content/campaigns/<id>)를 명시해야 합니다.');
    return { decision: 'verify-publish', campaign };
  }

  // (7) 최종 승인 이후 재렌더 금지
  if (/(render:card|build:short|render-cardnews\.mjs|build-shortform\.mjs)/.test(c) && campaign) {
    return { decision: 'verify-not-locked', campaign };
  }
  return { decision: 'allow' };
}

async function main() {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  const result = inspect(input?.tool_input?.command);
  const block = msg => { process.stderr.write(`[발행 게이트] ${msg}\n`); process.exit(2); };
  if (result.decision === 'deny') block(result.reason);
  if (result.decision === 'ask') {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: `[발행 게이트] ${result.reason}` } }));
    process.exit(0);
  }
  if (result.decision === 'verify-publish') {
    const { verifyPublishApproval } = await import(path.join(ROOT, 'tools', 'lib', 'campaign.mjs'));
    const v = await verifyPublishApproval(result.campaign);
    if (!v.ok) block(v.reason);
  }
  if (result.decision === 'verify-not-locked') {
    const { loadStatus } = await import(path.join(ROOT, 'tools', 'lib', 'campaign.mjs'));
    const st = await loadStatus(result.campaign);
    if (['publish_approved', 'published'].includes(st.stage)) block('최종 승인된 캠페인은 다시 렌더할 수 없습니다(승인 잠금). 재작업은 담당자가 --reopen 한 뒤에 하세요.');
  }
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
