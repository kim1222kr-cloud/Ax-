#!/usr/bin/env node
// 기획 보조: 카탈로그에서 이번 기간에 밀 만한 책을 뽑는다.
// - 최근 출간(기본 120일): 신간 런칭·초기 판매 구간
// - 출간 기념일(이번 달·다음 달): N주년 리마인드 포맷
// - 재정가 가능(발행 12개월 경과): 가격 프로모션 검토 대상(도서정가제)
// - 최근 캠페인 이력: content/campaigns 의 book 별 마지막 캠페인 날짜(과다 노출 방지)
// 사용법: npm run catalog -- [--days 120] [--date 2026-10-04] [--json]
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, readJson, exists, parseArgs } from './lib/common.mjs';

const toDate = s => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +(m[3] || 1))) : null;
};
const days = (a, b) => Math.round((a - b) / 86400000);

export async function catalogReport({ today = new Date(), windowDays = 120 } = {}) {
  const { books } = await readJson(path.join(ROOT, 'data', 'catalog.json'));
  const campaignsDir = path.join(ROOT, 'content', 'campaigns');
  const lastCampaign = {};
  if (await exists(campaignsDir)) {
    for (const d of await readdir(campaignsDir, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith('_')) continue;
      const meta = path.join(campaignsDir, d.name, 'campaign.json');
      if (!(await exists(meta))) continue;
      const { book } = await readJson(meta);
      const date = d.name.slice(0, 10);
      if (book && (!lastCampaign[book] || lastCampaign[book] < date)) lastCampaign[book] = date;
    }
  }
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const rows = books.filter(b => b.status !== 'unconfirmed').map(b => {
    const pd = toDate(b.pub_date);
    const age = pd ? days(t, pd) : null;
    const nextAnniv = pd ? (() => {
      let y = t.getUTCFullYear();
      let a = new Date(Date.UTC(y, pd.getUTCMonth(), pd.getUTCDate()));
      if (a < t) a = new Date(Date.UTC(y + 1, pd.getUTCMonth(), pd.getUTCDate()));
      return { date: a.toISOString().slice(0, 10), years: a.getUTCFullYear() - pd.getUTCFullYear(), inDays: days(a, t) };
    })() : null;
    return { slug: b.slug, title: b.title, author: b.author, track: b.track, pub_date: b.pub_date, age_days: age, creator: b.creator_author, next_anniversary: nextAnniv, last_campaign: lastCampaign[b.slug] || null };
  });
  return {
    today: t.toISOString().slice(0, 10),
    recent: rows.filter(r => r.age_days !== null && r.age_days >= 0 && r.age_days <= windowDays).sort((a, b) => a.age_days - b.age_days),
    anniversaries: rows.filter(r => r.next_anniversary && r.next_anniversary.inDays <= 60 && r.next_anniversary.years >= 1).sort((a, b) => a.next_anniversary.inDays - b.next_anniversary.inDays),
    repricing_eligible: rows.filter(r => r.age_days !== null && r.age_days >= 365).length,
    by_track: rows.reduce((m, r) => { m[r.track] = (m[r.track] || 0) + 1; return m; }, {}),
    never_campaigned_recent: rows.filter(r => r.age_days !== null && r.age_days <= 365 && !r.last_campaign).map(r => r.slug),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const today = a.date && a.date !== true ? new Date(a.date) : new Date();
  catalogReport({ today, windowDays: a.days ? +a.days : 120 }).then(r => {
    if (a.json) return console.log(JSON.stringify(r, null, 2));
    console.log(`기준일 ${r.today} · 트랙별 ${JSON.stringify(r.by_track)} · 재정가 가능(12개월+) ${r.repricing_eligible}종\n`);
    console.log('■ 최근 출간');
    for (const x of r.recent) console.log(`  - ${x.title} (${x.author}, ${x.pub_date}, D+${x.age_days}, ${x.track})${x.last_campaign ? ` · 마지막 캠페인 ${x.last_campaign}` : ' · 캠페인 없음'}`);
    console.log('\n■ 60일 내 출간 기념일');
    for (const x of r.anniversaries) console.log(`  - ${x.title} ${x.next_anniversary.years}주년 ${x.next_anniversary.date} (D-${x.next_anniversary.inDays})`);
    console.log(`\n■ 최근 1년 출간 중 캠페인 이력 없음: ${r.never_campaigned_recent.join(', ') || '없음'}`);
  }).catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
