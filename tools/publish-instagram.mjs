#!/usr/bin/env node
// 인스타그램 발행 (Instagram Graph API · 콘텐츠 퍼블리싱)
// 기본은 드라이런. 실제 발행은 --live + 최종 발행 승인(publish) + 승인 후 파일 무변경일 때만.
// 사용법: npm run publish:ig -- content/campaigns/<id> --type carousel|reels [--live]
// 필요 환경변수: IG_USER_ID, IG_ACCESS_TOKEN, (선택) IG_GRAPH_HOST, IG_API_VERSION, MEDIA_UPLOAD_CMD, MEDIA_PUBLIC_BASE_URL
// 참고: 프로페셔널(비즈니스/크리에이터) 계정 필요. 이미지는 JPEG만. 24시간 발행 한도는 content_publishing_limit 로 조회.
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs, campaignDir, exists } from './lib/common.mjs';
import { loadCampaign, loadStatus, saveStatus, verifyPublishApproval } from './lib/campaign.mjs';
import { uploadPublic } from './lib/media-host.mjs';

const HOST = process.env.IG_GRAPH_HOST || 'graph.facebook.com'; // Instagram Login 방식이면 graph.instagram.com
const VER = process.env.IG_API_VERSION || 'v23.0';               // 한 곳에 고정(pin)해 두고 정기 점검

function api(pathname, params = {}, method = 'GET') {
  const token = process.env.IG_ACCESS_TOKEN;
  const url = new URL(`https://${HOST}/${VER}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const init = method === 'GET' ? {} : { method, body };
  if (method === 'GET') for (const [k, v] of body) url.searchParams.set(k, v);
  return fetch(url, init).then(async r => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(`Graph API ${pathname} 실패: ${j.error?.message || r.status}`);
    return j;
  });
}

async function waitFinished(containerId, { timeoutMs = 10 * 60 * 1000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const { status_code, status } = await api(containerId, { fields: 'status_code,status' });
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`컨테이너 ${containerId} ${status_code}: ${status || ''}`);
    if (Date.now() - t0 > timeoutMs) throw new Error(`컨테이너 ${containerId} 처리 시간 초과`);
    await new Promise(r => setTimeout(r, 5000));
  }
}

function buildCaption(spec) {
  const tags = (spec.hashtags || []).join(' ');
  return [spec.caption || '', tags].filter(Boolean).join('\n\n');
}

export async function publishInstagram(dir, { type = 'carousel', live = false } = {}) {
  const c = await loadCampaign(dir);
  const id = path.basename(dir);
  const dryRun = !live;
  const log = [];
  const step = (msg) => { log.push(msg); console.log(`${dryRun ? '[드라이런] ' : ''}${msg}`); };

  if (live) {
    const v = await verifyPublishApproval(dir);
    if (!v.ok) throw new Error(v.reason);
    for (const k of ['IG_USER_ID', 'IG_ACCESS_TOKEN']) if (!process.env[k]) throw new Error(`${k} 가 없습니다.`);
  }
  const igUser = process.env.IG_USER_ID || '<IG_USER_ID>';

  if (live) {
    const lim = await api(`${igUser}/content_publishing_limit`, { fields: 'quota_usage,config' });
    const used = lim.data?.[0]?.quota_usage ?? 0, total = lim.data?.[0]?.config?.quota_total ?? '?';
    step(`발행 한도: ${used}/${total} (24시간)`);
    if (typeof total === 'number' && used >= total) throw new Error('24시간 발행 한도를 모두 사용했습니다.');
  }

  let result;
  if (type === 'carousel') {
    if (!c.cardnews) throw new Error('cardnews.json 이 없습니다.');
    const outDir = path.join(dir, 'out', 'cardnews');
    if (!(await exists(outDir))) throw new Error('렌더 결과가 없습니다. npm run render:card 먼저.');
    const jpgs = (await readdir(outDir)).filter(f => /^\d+\.jpg$/.test(f)).sort().map(f => path.join(outDir, f));
    // Content Publishing API의 캐러셀 children 상한은 10개 (앱 업로드 20장과 다름)
    if (jpgs.length < 2 || jpgs.length > 10) throw new Error(`캐러셀 이미지 수 ${jpgs.length} — API 발행은 2~10장만 가능합니다.`);
    const children = [];
    for (const f of jpgs) {
      const url = await uploadPublic(id, f, { dryRun });
      step(`업로드 ${path.basename(f)} → ${url}`);
      if (live) children.push((await api(`${igUser}/media`, { image_url: url, is_carousel_item: 'true' }, 'POST')).id);
      else step(`POST /${igUser}/media image_url=${url} is_carousel_item=true`);
    }
    const caption = buildCaption(c.cardnews);
    step(`POST /${igUser}/media media_type=CAROUSEL children=${children.length || jpgs.length}개 caption=${JSON.stringify(caption.slice(0, 60))}…`);
    if (live) {
      for (const ch of children) await waitFinished(ch);
      const parent = await api(`${igUser}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption }, 'POST');
      await waitFinished(parent.id);
      result = await api(`${igUser}/media_publish`, { creation_id: parent.id }, 'POST');
    }
  } else if (type === 'reels') {
    if (!c.shortform) throw new Error('shortform.json 이 없습니다.');
    const video = path.join(dir, 'out', 'shortform', 'short.mp4');
    if (!(await exists(video))) throw new Error('영상이 없습니다. npm run build:short 먼저.');
    const url = await uploadPublic(id, video, { dryRun });
    const coverUrl = await uploadPublic(id, path.join(dir, 'out', 'shortform', 'cover.jpg'), { dryRun });
    step(`업로드 short.mp4 → ${url}`);
    const caption = buildCaption({ caption: c.shortform.caption, hashtags: c.shortform.hashtags });
    step(`POST /${igUser}/media media_type=REELS video_url=${url} cover_url=${coverUrl} share_to_feed=true`);
    if (live) {
      const cont = await api(`${igUser}/media`, { media_type: 'REELS', video_url: url, cover_url: coverUrl, caption, share_to_feed: 'true' }, 'POST');
      await waitFinished(cont.id);
      result = await api(`${igUser}/media_publish`, { creation_id: cont.id }, 'POST');
    }
  } else {
    throw new Error('--type 은 carousel | reels');
  }

  if (live && result?.id) {
    const { permalink } = await api(result.id, { fields: 'permalink' });
    const status = await loadStatus(dir);
    status.published = [...(status.published || []), { platform: 'instagram', type, media_id: result.id, permalink, at: new Date().toISOString() }];
    status.stage = 'published';
    await saveStatus(dir, status);
    step(`✔ 발행 완료: ${permalink}`);
  } else {
    step(`POST /${igUser}/media_publish creation_id=<컨테이너>`);
    step('드라이런 종료. 실제 발행은 최종 승인 후 --live 로 실행합니다.');
  }
  return { log, result };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  publishInstagram(campaignDir(args._[0]), { type: args.type || 'carousel', live: !!args.live })
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
