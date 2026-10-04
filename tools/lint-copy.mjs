#!/usr/bin/env node
// 카피 컴플라이언스 린터 (결정론적 1차 검수). LLM 검수 에이전트(compliance-reviewer)의 앞단.
// 사용법: npm run lint:copy -- content/campaigns/<id>   → 오류 있으면 exit 1, 결과는 review/lint.json
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, writeJson, parseArgs, campaignDir, ROOT, exists } from './lib/common.mjs';
import { loadCampaign } from './lib/campaign.mjs';

const plain = s => String(s ?? '').replace(/\*\*/g, '');
const IG_API_CAROUSEL_MAX = 10;

// 검사 대상 텍스트를 위치 정보와 함께 모은다
function collect({ cardnews, shortform }) {
  const items = [];
  const push = (where, text, kind = 'copy') => { if (text) items.push({ where, text: plain(text), kind }); };
  if (cardnews) {
    (cardnews.slides || []).forEach((s, i) => {
      for (const k of ['kicker', 'title', 'subtitle', 'text', 'body', 'note', 'copy']) push(`cardnews.slides[${i + 1}].${k}`, s[k], s.type === 'quote' && k === 'text' ? 'quote' : 'copy');
      // stat 슬라이드의 숫자는 항상 '주장'으로 본다 (숫자+라벨을 함께 검사)
      if (s.type === 'stat') push(`cardnews.slides[${i + 1}].number`, `${s.number ?? ''} ${s.label ?? ''}`, 'stat');
      else push(`cardnews.slides[${i + 1}].label`, s.label);
      (s.items || []).forEach((it, j) => push(`cardnews.slides[${i + 1}].items[${j + 1}]`, it));
    });
    push('cardnews.caption', cardnews.caption, 'caption');
    push('cardnews.hashtags', (cardnews.hashtags || []).join(' '), 'hashtags');
  }
  if (shortform) {
    (shortform.scenes || []).forEach((s, i) => {
      for (const k of ['text', 'sub', 'title', 'copy', 'narration']) push(`shortform.scenes[${i + 1}].${k}`, s[k], s.type === 'quote' && k === 'text' ? 'quote' : 'copy');
    });
    push('shortform.title', shortform.title, 'title');
    push('shortform.description', shortform.description, 'caption');
    push('shortform.caption', shortform.caption, 'caption');
    push('shortform.hashtags', (shortform.hashtags || []).join(' '), 'hashtags');
  }
  return items;
}

export async function lintCampaign(dir) {
  const policy = await readJson(path.join(ROOT, 'data', 'policy.json'));
  const claimsPath = path.join(ROOT, 'data', 'claims.json');
  const claims = (await exists(claimsPath)) ? (await readJson(claimsPath)).claims || [] : [];
  const c = await loadCampaign(dir);
  const meta = c.meta;
  const approvals = meta.approvals || {};
  const items = collect(c);
  const issues = [];
  const add = (level, rule, where, message) => issues.push({ level, rule, where, message });

  for (const it of items) {
    const t = it.text;
    // R1 도서정가제
    for (const m of t.matchAll(/(\d{1,3})\s*%\s*(할인|세일|off|OFF|DC|dc|저렴)/g)) {
      if (+m[1] > policy.book_price_act.max_discount_percent) add('error', '도서정가제', it.where, `"${m[0]}" — 가격할인은 정가의 ${policy.book_price_act.max_discount_percent}% 이내(경제상 이익 합산 15%)만 가능합니다.`);
    }
    for (const w of policy.book_price_act.banned_phrases) if (t.includes(w)) add('error', '도서정가제', it.where, `"${w}" — 도서정가제 위반 소지가 있는 표현입니다.`);

    // R2 투자 권유·수익 보장
    for (const p of policy.investment.banned_patterns) {
      const m = t.match(new RegExp(p));
      if (m) add('error', '수익보장', it.where, `"${m[0]}" — 수익 보장·투자 권유로 읽히는 표현은 사용할 수 없습니다.`);
    }
    if ((c.cardnews?.track || c.shortform?.track || meta.track) === 'money') {
      for (const p of policy.investment.caution_patterns) {
        const m = t.match(new RegExp(p));
        if (m) add('warn', '재테크표현', it.where, `"${m[0]}" — 저자의 개인 사례임을 밝히고 일반화하지 마세요.`);
      }
    }

    // R3 수치·순위는 claims.json 등록분만
    const claimPatterns = it.kind === 'stat' ? [...policy.claims.patterns, '\\d[\\d,.]*\\s*(만|천|억|%|배|위|권|쇄)?'] : policy.claims.patterns;
    const seen = new Set();
    for (const p of claimPatterns) {
      for (const m of t.matchAll(new RegExp(p, 'g'))) {
        if (!m[0].trim() || seen.has(m.index)) continue;
        seen.add(m.index);
        // 수치 주변(앞뒤 20자) 문맥에 등록된 패턴이 있어야 같은 주장으로 본다
        const near = t.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20);
        const books = new Set(['*', meta.book, c.cardnews?.book, c.shortform?.book].filter(Boolean));
        const hit = claims.find(cl => books.has(cl.book) && (cl.patterns || []).some(cp => near.includes(cp)));
        if (!hit || hit.status === 'unverified') add('error', '미입증수치', it.where, `"${m[0]}" — data/claims.json 에 근거가 등록된 수치만 쓸 수 있습니다.`);
        else if (hit.status === 'company') add('warn', '회사자료수치', it.where, `"${m[0]}" — 회사 자료 기준(${hit.source}, ${hit.as_of}). ${hit.usage_note || '입증자료를 보관하세요.'}`);
      }
    }

    // R8 민감 소재
    for (const s of policy.sensitive) {
      const m = t.match(new RegExp(s.pattern));
      if (m && !approvals[s.approval_key]) add('error', '민감소재', it.where, `"${m[0]}" — ${s.reason} (campaign.json approvals.${s.approval_key} 필요)`);
    }

    // R10 톤
    for (const w of policy.tone_warnings) if (t.includes(w)) add('warn', '브랜드톤', it.where, `"${w}" — 필름 보이스(위로·신뢰)와 맞지 않는 자극적 표현입니다.`);

    // R7 인용 길이
    if (it.kind === 'quote' && t.length > policy.quotes.max_chars_per_quote) add('warn', '인용범위', it.where, `인용 ${t.length}자 — ${policy.quotes.max_chars_per_quote}자 이내 권장.`);
  }

  // R7 인용 승인·총량
  const quotes = items.filter(i => i.kind === 'quote');
  const totalQuote = quotes.reduce((n, q) => n + q.text.length, 0);
  if (totalQuote > policy.quotes.max_total_quote_chars) add('warn', '인용범위', 'campaign', `본문 인용 총 ${totalQuote}자 — ${policy.quotes.max_total_quote_chars}자 이내 권장.`);
  if (quotes.length && !approvals.quotes) add('warn', '인용승인', 'campaign', '본문 인용이 있습니다. 편집부가 문장과 쪽수를 확인한 뒤 campaign.json approvals.quotes 를 기록하세요.');

  // R4 광고 표기
  const needsAd = meta.sponsored === true || !!meta.author_collab?.paid;
  for (const [name, spec, capKey] of [['cardnews', c.cardnews, 'caption'], ['shortform', c.shortform, 'caption'], ['shortform', c.shortform, 'description'], ['shortform', c.shortform, 'title']]) {
    if (!spec) continue;
    const cap = plain(spec[capKey] || '');
    // 첫 줄 + 앞 N자 안에 있어야 '첫 부분 표기'로 인정 (짧은 캡션 끝의 #광고 는 인정하지 않음)
    const head = cap.split('\n')[0].slice(0, policy.disclosure.must_be_within_first_chars);
    const hasLabelHead = policy.disclosure.labels.some(l => head.includes(l));
    const hasLabelAnywhere = policy.disclosure.labels.some(l => cap.includes(l));
    if (needsAd) {
      if (!spec.disclosure) add('error', '광고표기', `${name}.disclosure`, '경제적 이해관계(유료·협찬)가 있는 캠페인입니다. disclosure: "광고" 를 설정하세요(첫 장/영상 시작·끝에 표시).');
      if (cap && !hasLabelHead && capKey !== 'title') add('error', '광고표기', `${name}.${capKey}`, `'광고' 또는 '협찬'을 첫 줄 앞 ${policy.disclosure.must_be_within_first_chars}자 안에 넣으세요('더보기' 뒤·해시태그 표기는 인정되지 않음).`);
    } else if (hasLabelAnywhere && !hasLabelHead && capKey !== 'title') {
      add('warn', '광고표기', `${name}.${capKey}`, '광고·협찬 문구가 본문 뒤쪽에 있습니다. 표기한다면 첫 부분으로 옮기세요.');
    }
  }

  // R5 AI 표시
  if (c.shortform) {
    const aiVoice = c.shortform.voice?.provider && c.shortform.voice.provider !== 'none';
    const aiImages = (c.shortform.scenes || []).some(s => s.ai_generated);
    if (aiVoice || aiImages) {
      for (const k of ['description', 'caption']) {
        const txt = plain(c.shortform[k] || '');
        // 필름은 AI 기본법상 '이용자'(과기정통부 해설)라 법적 의무는 아니지만, 플랫폼 정책과 사내 투명성 원칙으로 표시한다
        if (txt && !policy.ai.disclosure_keywords.some(kw => txt.includes(kw))) add('error', 'AI표시', `shortform.${k}`, 'AI 음성/이미지를 사용했습니다. 사내 투명성 원칙에 따라 설명·캡션에 표시하세요(예: "AI 음성으로 제작").');
      }
    }
  }
  if (c.cardnews && (c.cardnews.slides || []).some(s => s.ai_generated) && !c.cardnews.ai_label) add('error', 'AI표시', 'cardnews.ai_label', '생성형 AI 이미지를 쓴 슬라이드가 있습니다. ai_label: true 로 표시하세요.');

  // 공정위 추천·보증 심사지침(2026-06-01 시행): AI·딥페이크 가상인물이 추천·보증하면 '가상인물' 표시 의무
  const virtual = [...(c.cardnews?.slides || []), ...(c.shortform?.scenes || [])].some(x => x.virtual_person);
  if (virtual) {
    for (const [where, txt] of [['cardnews.caption', c.cardnews?.caption], ['shortform.caption', c.shortform?.caption], ['shortform.description', c.shortform?.description]]) {
      if (txt && !plain(txt).split('\n')[0].includes('가상인물')) add('error', '가상인물', where, "AI 가상인물이 추천하는 장면이 있습니다. 첫 줄에 '가상인물' 표시가 필요합니다(공정위 심사지침, 2026-06-01 시행). 화면에도 등장하는 동안 표시하세요.");
    }
  }

  // R6 플랫폼 한도
  const P = policy.platform;
  if (c.cardnews) {
    const n = (c.cardnews.slides || []).length;
    // 앱은 20장까지지만 Content Publishing API는 공식 문서상 children 최대 10개 (2026-10 확인)
    const max = Math.min(P.carousel_max, IG_API_CAROUSEL_MAX);
    if (n < P.carousel_min || n > max) add('error', '플랫폼', 'cardnews.slides', `캐러셀은 ${P.carousel_min}~${max}장 (현재 ${n}). API 자동 발행은 10장까지만 됩니다.`);
    const cap = (c.cardnews.caption || '') + '\n' + (c.cardnews.hashtags || []).join(' ');
    if (cap.length > P.instagram_caption_max) add('error', '플랫폼', 'cardnews.caption', `인스타 캡션 ${cap.length}자 > ${P.instagram_caption_max}자.`);
    if ((c.cardnews.hashtags || []).length > P.instagram_hashtags_max) add('error', '플랫폼', 'cardnews.hashtags', `해시태그 ${c.cardnews.hashtags.length}개 — 인스타그램은 게시물당 ${P.instagram_hashtags_max}개 제한(2025-12 발표).`);
  }
  if (c.shortform) {
    const s = c.shortform;
    if ((s.title || '').length > P.youtube_title_max) add('error', '플랫폼', 'shortform.title', `유튜브 제목 ${s.title.length}자 > ${P.youtube_title_max}자.`);
    if ((s.description || '').length > P.youtube_description_max) add('error', '플랫폼', 'shortform.description', `유튜브 설명 ${s.description.length}자 > ${P.youtube_description_max}자.`);
    const tagChars = (s.tags || []).reduce((n, t) => n + t.length + (t.includes(' ') ? 2 : 0), 0) + Math.max(0, (s.tags || []).length - 1);
    if (tagChars > P.youtube_tags_total_chars_max) add('error', '플랫폼', 'shortform.tags', `유튜브 태그 합계 ${tagChars}자 > ${P.youtube_tags_total_chars_max}자.`);
    if ((s.hashtags || []).length > P.instagram_hashtags_max) add('error', '플랫폼', 'shortform.hashtags', `해시태그 ${s.hashtags.length}개 — 인스타그램은 게시물당 ${P.instagram_hashtags_max}개 제한(2025-12 발표).`);
  }

  const result = {
    campaign: path.basename(dir),
    errors: issues.filter(i => i.level === 'error').length,
    warnings: issues.filter(i => i.level === 'warn').length,
    issues,
  };
  await writeJson(path.join(dir, 'review', 'lint.json'), result);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const dir = campaignDir(args._[0]);
  lintCampaign(dir).then(r => {
    for (const i of r.issues) console.log(`${i.level === 'error' ? '❌' : '⚠️ '} [${i.rule}] ${i.where}: ${i.message}`);
    console.log(`\n${r.errors ? '✖' : '✔'} 오류 ${r.errors} · 경고 ${r.warnings} → ${path.relative(process.cwd(), path.join(dir, 'review', 'lint.json'))}`);
    process.exit(r.errors ? 1 : 0);
  }).catch(e => { console.error(`✖ ${e.message}`); process.exit(1); });
}
