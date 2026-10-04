#!/usr/bin/env node
// 발행된 콘텐츠 성과 수집 → data/metrics/<날짜>.json
// 사용법: npm run metrics -- [--since 2026-09-01] [--dry-run]
// 인스타: views, reach, saved, shares, total_interactions (impressions·plays는 2025-04 지원 종료)
// 유튜브: YouTube Analytics API (scope: yt-analytics.readonly) — views, 시청시간, 평균 시청 길이, 좋아요, 공유
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, writeJson, parseArgs } from './lib/common.mjs';
import { loadStatus } from './lib/campaign.mjs';

const HOST = process.env.IG_GRAPH_HOST || 'graph.facebook.com';
const VER = process.env.IG_API_VERSION || 'v23.0';

async function igInsights(mediaId, type) {
  const metric = type === 'reels'
    ? 'views,reach,saved,shares,total_interactions,ig_reels_avg_watch_time'
    : 'views,reach,saved,shares,total_interactions';
  const url = `https://${HOST}/${VER}/${mediaId}/insights?metric=${metric}&access_token=${process.env.IG_ACCESS_TOKEN}`;
  const j = await (await fetch(url)).json();
  if (j.error) return { error: j.error.message };
  return Object.fromEntries((j.data || []).map(d => [d.name, d.values?.[0]?.value ?? d.total_value?.value]));
}

async function ytToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: process.env.YT_CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET, refresh_token: process.env.YT_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  return (await r.json()).access_token;
}

async function ytStats(token, videoId, since) {
  const q = new URLSearchParams({
    ids: 'channel==MINE', startDate: since, endDate: new Date().toISOString().slice(0, 10),
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,shares,subscribersGained',
    filters: `video==${videoId}`,
  });
  const j = await (await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${q}`, { headers: { authorization: `Bearer ${token}` } })).json();
  if (j.error) return { error: j.error.message };
  const cols = (j.columnHeaders || []).map(c => c.name);
  return Object.fromEntries(cols.map((c, i) => [c, j.rows?.[0]?.[i] ?? 0]));
}

export async function fetchMetrics({ since, dryRun }) {
  const base = path.join(ROOT, 'content', 'campaigns');
  const ids = (await readdir(base, { withFileTypes: true })).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name);
  const rows = [];
  let yt = null;
  for (const id of ids) {
    const st = await loadStatus(path.join(base, id));
    for (const p of st.published || []) {
      if (dryRun) { rows.push({ campaign: id, ...p, metrics: '(dry-run)' }); continue; }
      if (p.platform === 'instagram') rows.push({ campaign: id, ...p, metrics: await igInsights(p.media_id, p.type) });
      if (p.platform === 'youtube') {
        yt ??= await ytToken();
        rows.push({ campaign: id, ...p, metrics: await ytStats(yt, p.video_id, since || p.at.slice(0, 10)) });
      }
    }
  }
  const out = path.join(ROOT, 'data', 'metrics', `${new Date().toISOString().slice(0, 10)}.json`);
  if (!dryRun) await writeJson(out, { collected_at: new Date().toISOString(), rows });
  return { out, rows };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  fetchMetrics({ since: a.since, dryRun: !!a['dry-run'] })
    .then(r => { console.log(`${r.rows.length}건${a['dry-run'] ? ' (드라이런)' : ` → ${path.relative(process.cwd(), r.out)}`}`); for (const x of r.rows) console.log(`- ${x.campaign} ${x.platform}/${x.type}: ${JSON.stringify(x.metrics)}`); })
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
