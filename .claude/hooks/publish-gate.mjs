#!/usr/bin/env node
// PreToolUse 훅: 에이전트의 Bash 호출 중 (1) 승인 기록, (2) 실발행(--live), (3) 발행 API 직접 호출을 검사한다.
// exit 2 → Claude Code가 해당 도구 호출을 차단하고 stderr 메시지를 에이전트에게 돌려준다.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const cmd = input?.tool_input?.command || '';
if (!cmd) process.exit(0);

const block = (msg) => { process.stderr.write(`[발행 게이트] ${msg}\n`); process.exit(2); };

// (1) 승인은 사람만 한다
if (/(^|[\s;&|(])(npm\s+run\s+approve|node\s+\S*tools\/approve\.mjs)/.test(cmd) || /status\.json/.test(cmd) && /(>|tee|sed\s+-i|jq)/.test(cmd)) {
  block('승인 기록(approve / status.json 수정)은 담당자만 할 수 있습니다. 승인 요청 메시지를 작성해 사람에게 넘기세요.');
}

// (3) 발행 API 직접 호출 금지 — 반드시 publish 스크립트(승인 검증 내장)를 거친다
if (/graph\.(facebook|instagram)\.com|googleapis\.com\/upload|youtube\/v3\/videos|open\.tiktokapis\.com/.test(cmd)) {
  block('플랫폼 API를 직접 호출할 수 없습니다. npm run publish:ig / publish:yt 를 사용하세요.');
}

// (2) 실발행은 publish 승인 + 승인 후 무변경일 때만
const isPublish = /(npm\s+run\s+publish:(ig|yt)|tools\/publish-(instagram|youtube)\.mjs)/.test(cmd);
if (isPublish && /--live\b/.test(cmd)) {
  const m = cmd.match(/content\/campaigns\/[^\s"';&|]+/);
  if (!m) block('--live 발행에는 캠페인 경로(content/campaigns/<id>)를 명시해야 합니다.');
  const { verifyPublishApproval } = await import(path.join(ROOT, 'tools', 'lib', 'campaign.mjs'));
  const v = await verifyPublishApproval(path.resolve(ROOT, m[0]));
  if (!v.ok) block(v.reason);
}
process.exit(0);
