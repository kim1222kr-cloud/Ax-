#!/usr/bin/env node
// 새 캠페인 폴더 생성
// 사용법: npm run new -- --book <slug> --slug <짧은이름> [--date 2026-10-10] [--track essay|money|insight] [--deliverables cardnews,shortform]
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, readJson, writeJson, exists, parseArgs } from './lib/common.mjs';

export async function newCampaign({ book, slug, date, track, deliverables }) {
  if (!book || book === true) throw new Error('--book <도서 slug> 가 필요합니다 (data/catalog.json 참고).');
  const catalog = await readJson(path.join(ROOT, 'data', 'catalog.json'));
  const info = catalog.books.find(b => b.slug === book);
  if (!info) throw new Error(`data/catalog.json 에 "${book}" 이 없습니다. 먼저 도서를 등록하세요.`);
  const d = date && date !== true ? date : new Date().toISOString().slice(0, 10);
  const id = `${d}-${slug && slug !== true ? slug : book}`;
  const dir = path.join(ROOT, 'content', 'campaigns', id);
  if (await exists(dir)) throw new Error(`이미 있습니다: ${dir}`);
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  await mkdir(path.join(dir, 'review'), { recursive: true });

  const t = track && track !== true ? track : info.track;
  await writeJson(path.join(dir, 'campaign.json'), {
    id,
    book,
    book_title: info.title,
    author: info.author,
    track: t,
    deliverables: (deliverables && deliverables !== true ? deliverables : 'cardnews,shortform').split(','),
    channels: ['instagram', 'youtube'],
    goal: '',
    target_reader: '',
    key_message: '',
    sponsored: false,
    author_collab: null,
    approvals: {},
    scheduled_at: null,
    owner: '',
  });
  await writeJson(path.join(dir, 'status.json'), { stage: 'brief', approvals: [], published: [] });
  await writeFile(path.join(dir, 'brief.md'), `# 브리프 — ${info.title}

- 캠페인 ID: ${id}
- 도서: ${info.title} / ${info.author} (${info.pub_date || '출간일 미상'})
- 트랙: ${t}
- 산출물: 카드뉴스(인스타 캐러셀) · 숏폼(릴스/쇼츠)

## 목표 (무엇을 움직일 것인가)
- 예: 신간 인지도 / 예약판매 / 역주행 / 저자 북토크 모객

## 타깃 독자
-

## 핵심 메시지 (한 문장)
-

## 사용 가능한 자료
- 승인된 본문 인용(쪽수 포함):
- 표지·내지 이미지(assets/):
- 등록된 수치(data/claims.json):

## 일정
- 기획안 승인:
- 시안 승인:
- 발행:
`, 'utf8');
  return { id, dir };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  newCampaign({ book: a.book, slug: a.slug, date: a.date, track: a.track, deliverables: a.deliverables })
    .then(r => console.log(`✔ ${path.relative(process.cwd(), r.dir)}`))
    .catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
