#!/usr/bin/env node
// 새 캠페인 폴더 생성 (series-planner 가 사용)
// 사용법: npm run new -- --book <slug> --slug <짧은영문> --date <발행일 YYYY-MM-DD> --track <essay|money|insight> --deliverables <cardnews|shortform|cardnews,shortform> [--format F01]
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, readJson, writeJson, exists, parseArgs } from './lib/common.mjs';

const TRACKS = ['essay', 'money', 'insight'];
const DELIVERABLES = ['cardnews', 'shortform'];

export async function newCampaign({ book, slug, date, track, deliverables, format }) {
  if (!book || book === true) throw new Error('--book <도서 slug> 가 필요합니다 (data/catalog.json 참고).');
  const catalog = await readJson(path.join(ROOT, 'data', 'catalog.json'));
  const info = catalog.books.find(b => b.slug === book);
  if (!info) throw new Error(`data/catalog.json 에 "${book}" 이 없습니다. plan.md 의 '도서 등록 요청'에 올리세요.`);
  if (info.status === 'unconfirmed') throw new Error(`"${book}" 은 출판사 확인 전(unconfirmed) 도서입니다.`);
  const d = date && date !== true ? date : new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('--date 는 YYYY-MM-DD 형식');
  const s = slug && slug !== true ? slug : book;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) throw new Error('--slug 는 영문 소문자·숫자·하이픈만');
  const t = track && track !== true ? track : info.track;
  if (!TRACKS.includes(t)) throw new Error(`--track 은 ${TRACKS.join('|')}`);
  const dl = (deliverables && deliverables !== true ? deliverables : 'cardnews,shortform').split(',').map(x => x.trim());
  if (!dl.length || dl.some(x => !DELIVERABLES.includes(x))) throw new Error(`--deliverables 는 ${DELIVERABLES.join(',')} 중에서`);

  const id = `${d}-${s}`;
  const dir = path.join(ROOT, 'content', 'campaigns', id);
  if (await exists(dir)) throw new Error(`이미 있습니다: ${dir}`);
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  await mkdir(path.join(dir, 'review'), { recursive: true });

  await writeJson(path.join(dir, 'campaign.json'), {
    id,
    book,
    book_title: info.title,
    author: info.author,
    track: t,
    format_id: format && format !== true ? format : null,
    series: null,
    risk_tier: null,
    deliverables: dl,
    channels: dl.includes('shortform') ? ['instagram', 'youtube'] : ['instagram'],
    goal: '',
    target_reader: '',
    key_message: '',
    primary_metric: null,
    experiment: null,
    featured_books: [],
    sponsored: false,
    author_collab: null,
    scheduled_at: null,
    owner: '',
  });
  // status.json 은 사람(approve)과 발행 스크립트만 갱신한다
  await writeJson(path.join(dir, 'status.json'), { stage: 'brief', approvals: [], grants: {}, published: [] });
  await writeFile(path.join(dir, 'brief.md'), `# 기획안 — ${info.title}

- 캠페인 ID: ${id}
- 도서: ${info.title} / ${info.author} (${info.pub_date || '출간일 미상'})
- 트랙: ${t} · 산출물: ${dl.join(', ')}

## 1. 목표

## 2. 타깃

## 3. 핵심 메시지 (한 문장)

## 4. 포맷 ID · 산출물 · 채널 · 슬롯

## 5. 훅 후보 3개
1. (질문형)
2. (2인칭 확언형)
3. (저자 권위·숫자형 — claims.json 등록 수치만)

## 6. 근거
- 사용할 claims id:
- 본문 인용 필요 여부: (필요하면 편집부 원문을 assets/quotes-source.* 로)
- 필요한 자산:

## 7. 리스크 프로파일
- 티어(green/yellow/red)와 근거:
- 필요한 grant(quotes / ceo_story / legal):
- 단계별 승인자:
- 저자 리스크·도서정가제 검토 메모:

## 8. 측정
- primary_metric:
- 가설:
- 실험 변수:

## 9. 사람에게 요청할 자료
`, 'utf8');
  return { id, dir };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  newCampaign({ book: a.book, slug: a.slug, date: a.date, track: a.track, deliverables: a.deliverables, format: a.format })
    .then(r => console.log(`✔ content/campaigns/${r.id}`))
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
