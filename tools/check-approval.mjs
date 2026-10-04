#!/usr/bin/env node
// 승인 상태 점검(읽기 전용) — 에이전트도 실행 가능
// 사용법: npm run check:approval -- content/campaigns/<id> [--json]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, campaignDir } from './lib/common.mjs';
import { approvalReport } from './lib/campaign.mjs';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const dir = campaignDir(a._[0]);
  approvalReport(dir).then(r => {
    if (a.json) return console.log(JSON.stringify(r, null, 2));
    const line = (label, x) => x
      ? `${label}: ${x.by} @ ${x.at}${x.changed_since === null ? '' : x.changed_since.length ? ` · ⚠️ 이후 변경 ${x.changed_since.join(', ')}` : ' · 이후 변경 없음'}`
      : `${label}: 없음`;
    console.log(`${path.basename(dir)} — stage=${r.stage} · grants=[${r.grants.join(', ') || '없음'}]`);
    console.log(`  ${line('기획(plan)', r.plan)}`);
    console.log(`  ${line('시안(draft)', r.draft)}`);
    console.log(`  ${line('최종(publish)', r.publish)}`);
    for (const p of r.published) console.log(`  발행: ${p.platform}/${p.type} ${p.permalink || p.url || ''} (${p.at})`);
    for (const x of r.author_checks) console.log(`  저자 점검 ${x.author}: ${x.ok ? `✅ ${x.latest}` : `⚠️ ${x.reason}`}`);
  }).catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
