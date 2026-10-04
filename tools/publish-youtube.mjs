#!/usr/bin/env node
// 유튜브 쇼츠 업로드 (YouTube Data API v3, resumable upload)
// 세로(9:16)·3분 이하 영상은 별도 플래그 없이 Shorts로 분류된다.
// 기본은 드라이런. 실제 업로드는 --live + 최종 발행 승인 + 승인 후 파일 무변경일 때만.
// 사용법: npm run publish:yt -- content/campaigns/<id> [--live] [--privacy public|unlisted|private] [--publish-at 2026-10-10T11:00:00+09:00]
// 필요 환경변수: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (scope: youtube.upload)
// 주의: API 프로젝트가 YouTube 감사(audit)를 통과하기 전에는 업로드 영상이 '비공개'로 고정된다.
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs, campaignDir, exists } from './lib/common.mjs';
import { loadCampaign, loadStatus, saveStatus, verifyPublishApproval } from './lib/campaign.mjs';

async function accessToken() {
  for (const k of ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN']) if (!process.env[k]) throw new Error(`${k} 가 없습니다.`);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID,
      client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: process.env.YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`OAuth 토큰 발급 실패: ${j.error_description || j.error}`);
  return j.access_token;
}

export async function publishYoutube(dir, { live = false, privacy = 'public', publishAt } = {}) {
  const c = await loadCampaign(dir);
  if (!c.shortform) throw new Error('shortform.json 이 없습니다.');
  const video = path.join(dir, 'out', 'shortform', 'short.mp4');
  if (!(await exists(video))) throw new Error('영상이 없습니다. npm run build:short 먼저.');
  const s = c.shortform;
  const aiVoice = s.voice?.provider && s.voice.provider !== 'none';
  const metadata = {
    snippet: {
      title: s.title,
      description: s.description || '',
      tags: s.tags || [],
      categoryId: '22', // People & Blogs (교육형이면 27)
      defaultLanguage: 'ko',
      defaultAudioLanguage: 'ko',
    },
    status: {
      privacyStatus: publishAt ? 'private' : privacy, // 예약 공개는 private + publishAt
      ...(publishAt ? { publishAt: new Date(publishAt).toISOString() } : {}),
      selfDeclaredMadeForKids: false,
      // 사실적인 합성 인물·음성이 있으면 true. AI 내레이션만 쓴 경우에도 보수적으로 true를 권장
      containsSyntheticMedia: !!(aiVoice || (s.scenes || []).some(x => x.ai_generated)),
    },
  };
  const size = (await stat(video)).size;
  if (!live) {
    console.log('[드라이런] POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status');
    console.log(`[드라이런] 메타데이터: ${JSON.stringify(metadata, null, 2)}`);
    console.log(`[드라이런] PUT <업로드 URL> (${(size / 1024 / 1024).toFixed(1)}MB video/mp4)`);
    console.log('[드라이런] 종료. 실제 업로드는 최종 승인 후 --live 로 실행합니다.');
    return { dryRun: true, metadata };
  }

  const v = await verifyPublishApproval(dir);
  if (!v.ok) throw new Error(v.reason);
  const token = await accessToken();
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-type': 'video/mp4',
      'x-upload-content-length': String(size),
    },
    body: JSON.stringify(metadata),
  });
  if (!init.ok) throw new Error(`업로드 세션 생성 실패 (${init.status}): ${(await init.text()).slice(0, 300)}`);
  const uploadUrl = init.headers.get('location');
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'video/mp4', 'content-length': String(size) },
    body: await readFile(video),
  });
  const res = await put.json();
  if (!put.ok) throw new Error(`업로드 실패 (${put.status}): ${JSON.stringify(res).slice(0, 300)}`);
  const url = `https://youtube.com/shorts/${res.id}`;
  const status = await loadStatus(dir);
  status.published = [...(status.published || []), { platform: 'youtube', type: 'shorts', video_id: res.id, url, privacy: metadata.status.privacyStatus, publishAt: metadata.status.publishAt, at: new Date().toISOString() }];
  status.stage = 'published';
  await saveStatus(dir, status);
  console.log(`✔ 업로드 완료: ${url} (${metadata.status.privacyStatus}${publishAt ? `, ${publishAt} 공개 예약` : ''})`);
  return { id: res.id, url };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  publishYoutube(campaignDir(args._[0]), { live: !!args.live, privacy: args.privacy || 'public', publishAt: args['publish-at'] })
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
