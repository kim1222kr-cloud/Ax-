// 카드뉴스 슬라이드 HTML 생성기
// 슬라이드 타입: cover | quote | text | list | stat | book | cta
import { esc, lines, rich, fontLinks, assetUrl } from './common.mjs';

function fontStack(brand, which) {
  return which === 'serif'
    ? `'${brand.fonts.serif}', 'Noto Serif KR', serif`
    : `'${brand.fonts.sans}', 'Pretendard', system-ui, sans-serif`;
}

function baseCss({ brand, track, fmt }) {
  const c = track.colors;
  return `
  :root {
    --bg:${c.bg}; --surface:${c.surface}; --ink:${c.ink}; --muted:${c.muted};
    --accent:${c.accent}; --line:${c.line};
    --display:${fontStack(brand, track.display_font)};
    --body:${fontStack(brand, track.body_font)};
    --W:${fmt.width}px; --H:${fmt.height}px; --S:${fmt.safe}px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { width:var(--W); height:var(--H); background:var(--bg); }
  body {
    font-family:var(--body); color:var(--ink);
    word-break:keep-all; overflow-wrap:anywhere; line-break:strict;
    -webkit-font-smoothing:antialiased;
  }
  .slide { position:relative; width:var(--W); height:var(--H); overflow:hidden; background:var(--bg); }
  /* 필름 스트립 모티프: '우리의 이야기는 영화다' */
  .strip { position:absolute; left:0; right:0; height:34px; display:flex; justify-content:space-between; padding:0 22px; align-items:center; opacity:.18; }
  .strip.top { top:0; } .strip.bottom { bottom:0; }
  .strip i { flex:0 0 30px; height:18px; border-radius:4px; background:var(--ink); }
  .frame { position:absolute; inset:calc(var(--S) + 10px) var(--S) calc(var(--S) + 10px) var(--S); display:flex; flex-direction:column; }
  .meta { display:flex; justify-content:space-between; align-items:center; font-size:26px; color:var(--muted); letter-spacing:.02em; }
  .meta .brand { font-weight:700; letter-spacing:.18em; }
  .badges { display:flex; gap:12px; }
  .badge { font-size:24px; font-weight:700; padding:6px 16px; border-radius:999px; border:2px solid var(--ink); color:var(--ink); }
  .badge.ad { background:var(--ink); color:var(--bg); }
  .content { flex:1; display:flex; flex-direction:column; justify-content:center; min-height:0; }
  .fit { overflow:hidden; }
  .hl { color:var(--accent); }
  ${track.highlight === 'marker' ? '.hl { color:inherit; background:linear-gradient(transparent 56%, ' + c.accent + 'AA 56%, ' + c.accent + 'AA 92%, transparent 92%); padding:0 .06em; } .kicker { color:var(--ink); } .l-num { color:var(--ink) !important; } .c-actions span:first-child { color:var(--ink) !important; }' : ''}
  .kicker { font-size:32px; font-weight:700; color:var(--accent); margin-bottom:28px; letter-spacing:.02em; }
  .title { font-family:var(--display); font-weight:800; font-size:88px; line-height:1.22; letter-spacing:-.02em; }
  .subtitle { margin-top:36px; font-size:38px; line-height:1.5; color:var(--muted); font-weight:500; }
  .body { font-size:42px; line-height:1.62; font-weight:500; }
  .foot { display:flex; justify-content:space-between; align-items:flex-end; font-size:26px; color:var(--muted); }
  .foot .src { max-width:75%; line-height:1.4; }
  .ai { font-size:20px; color:var(--muted); opacity:.85; }
  `;
}

const strip = (n = 18) => `<div class="strip top">${'<i></i>'.repeat(n)}</div><div class="strip bottom">${'<i></i>'.repeat(n)}</div>`;

function metaRow({ brand, spec, idx, total }) {
  const badges = [];
  if (idx === 0 && spec.disclosure) badges.push(`<span class="badge ad">${esc(spec.disclosure)}</span>`);
  const left = badges.length ? `<div class="badges">${badges.join('')}</div>` : `<span class="brand">${esc(brand.brand.name_en)}</span>`;
  return `<div class="meta">${left}<span>${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>`;
}

function footRow({ brand, spec, slide, idx, total }) {
  const src = slide.source || (slide.type === 'quote' ? spec.book_title : '');
  const ai = spec.ai_label && idx === total - 1 ? `<div class="ai">${esc(brand.disclosure.ai_image_note)}</div>` : '';
  return `<div class="foot"><div class="src">${src ? esc(src) : ''}${ai}</div><span>${esc(brand.brand.instagram)}</span></div>`;
}

const renderers = {
  cover: ({ slide, baseDir }) => {
    const img = assetUrl(slide.image, baseDir);
    return `
    <style>
      .cover-img { width:100%; height:520px; border-radius:18px; background:var(--surface) center/cover no-repeat; margin-bottom:56px; ${img ? `background-image:url('${img}');` : 'display:none;'} }
      .cover .title { font-size:${slide.title_size || 96}px; }
    </style>
    <div class="content cover fit">
      <div class="cover-img"></div>
      ${slide.kicker ? `<div class="kicker">${lines(slide.kicker)}</div>` : ''}
      <div class="title">${rich(slide.title)}</div>
      ${slide.subtitle ? `<div class="subtitle">${lines(slide.subtitle)}</div>` : ''}
    </div>`;
  },

  quote: ({ slide }) => `
    <style>
      .q-mark { font-family:var(--display); font-size:180px; line-height:.8; color:var(--accent); height:110px; }
      .q-text { font-family:var(--display); font-size:${slide.size || 62}px; line-height:1.6; font-weight:700; letter-spacing:-.01em; }
      .q-page { margin-top:40px; font-size:30px; color:var(--muted); }
    </style>
    <div class="content fit">
      <div class="q-mark">“</div>
      <div class="q-text">${rich(slide.text)}</div>
      ${slide.page ? `<div class="q-page">${esc(slide.page)}</div>` : ''}
    </div>`,

  text: ({ slide }) => `
    <style> .t-title { font-family:var(--display); font-weight:800; font-size:64px; line-height:1.3; margin-bottom:44px; } </style>
    <div class="content fit">
      ${slide.title ? `<div class="t-title">${rich(slide.title)}</div>` : ''}
      <div class="body">${rich(slide.body)}</div>
    </div>`,

  list: ({ slide }) => `
    <style>
      .l-title { font-family:var(--display); font-weight:800; font-size:62px; line-height:1.3; margin-bottom:48px; }
      .l-items { list-style:none; display:flex; flex-direction:column; gap:30px; }
      .l-items li { display:flex; gap:28px; align-items:flex-start; font-size:40px; line-height:1.5; font-weight:600; }
      .l-num { flex:0 0 64px; height:64px; border-radius:50%; background:var(--accent); color:var(--bg); font-weight:800; font-size:32px; display:flex; align-items:center; justify-content:center; margin-top:2px; }
      .l-items li span.txt { flex:1; }
    </style>
    <div class="content fit">
      ${slide.title ? `<div class="l-title">${rich(slide.title)}</div>` : ''}
      <ul class="l-items">${(slide.items || []).map((it, i) => `<li><span class="l-num">${i + 1}</span><span class="txt">${rich(it)}</span></li>`).join('')}</ul>
    </div>`,

  stat: ({ slide }) => `
    <style>
      .s-num { font-family:'Pretendard'; font-weight:900; font-size:${slide.size || 200}px; line-height:1; color:var(--accent); letter-spacing:-.04em; }
      .s-label { margin-top:36px; font-size:52px; font-weight:800; line-height:1.35; }
      .s-note { margin-top:28px; font-size:32px; color:var(--muted); line-height:1.5; }
    </style>
    <div class="content fit">
      <div class="s-num">${esc(slide.number)}</div>
      <div class="s-label">${rich(slide.label)}</div>
      ${slide.note ? `<div class="s-note">${lines(slide.note)}</div>` : ''}
    </div>`,

  book: ({ slide, baseDir }) => {
    const cover = assetUrl(slide.cover, baseDir);
    return `
    <style>
      .b-wrap { display:flex; flex-direction:column; align-items:center; text-align:center; }
      .b-cover { width:520px; height:740px; border-radius:6px 14px 14px 6px; background:var(--surface) center/cover no-repeat; box-shadow: 0 30px 60px rgba(0,0,0,.25), inset 10px 0 18px rgba(0,0,0,.12); ${cover ? `background-image:url('${cover}');` : ''} display:flex; align-items:center; justify-content:center; padding:40px; }
      .b-cover .ph { font-family:var(--display); font-size:44px; font-weight:800; line-height:1.35; color:var(--ink); }
      .b-title { margin-top:56px; font-family:var(--display); font-size:52px; font-weight:800; line-height:1.3; }
      .b-author { margin-top:16px; font-size:32px; color:var(--muted); }
      .b-copy { margin-top:28px; font-size:34px; line-height:1.5; font-weight:600; }
    </style>
    <div class="content fit"><div class="b-wrap">
      <div class="b-cover">${cover ? '' : `<div class="ph">${lines(slide.title)}</div>`}</div>
      <div class="b-title">${lines(slide.title)}</div>
      ${slide.author ? `<div class="b-author">${esc(slide.author)}</div>` : ''}
      ${slide.copy ? `<div class="b-copy">${rich(slide.copy)}</div>` : ''}
    </div></div>`;
  },

  cta: ({ slide, brand }) => `
    <style>
      .c-title { font-family:var(--display); font-weight:800; font-size:72px; line-height:1.3; }
      .c-body { margin-top:40px; font-size:38px; line-height:1.6; color:var(--muted); font-weight:500; }
      .c-actions { margin-top:64px; display:flex; flex-wrap:wrap; gap:18px; }
      .c-actions span { font-size:32px; font-weight:700; padding:16px 30px; border-radius:999px; background:var(--surface); border:2px solid var(--line); }
      .c-actions span:first-child { background:var(--accent); color:var(--bg); border-color:var(--accent); }
    </style>
    <div class="content fit">
      <div class="c-title">${rich(slide.title)}</div>
      ${slide.body ? `<div class="c-body">${lines(slide.body)}</div>` : ''}
      <div class="c-actions">${(slide.actions || ['저장해두고 다시 읽기', '필요한 친구에게 보내기', `프로필 링크 ${brand.brand.instagram}`]).map(a => `<span>${esc(a)}</span>`).join('')}</div>
    </div>`,
};

export const SLIDE_TYPES = Object.keys(renderers);

export function slideHtml({ brand, track, fmt, spec, slide, idx, total, baseDir }) {
  const r = renderers[slide.type];
  if (!r) throw new Error(`슬라이드 ${idx + 1}: 알 수 없는 type "${slide.type}" (가능: ${SLIDE_TYPES.join(', ')})`);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
${fontLinks()}
<style>${baseCss({ brand, track, fmt })}</style></head>
<body><div class="slide">${strip()}<div class="frame">
${metaRow({ brand, spec, idx, total })}
${r({ slide, brand, baseDir })}
${footRow({ brand, spec, slide, idx, total })}
</div></div>
<script>
  // 넘치는 텍스트 자동 축소 (최소 62%). 그래도 넘치면 window.__overflow = true
  window.__fit = async () => {
    await document.fonts.ready;
    const box = document.querySelector('.fit');
    if (!box) return { overflow:false, scale:1 };
    let scale = 1;
    const els = [...box.querySelectorAll('*')].filter(e => getComputedStyle(e).fontSize);
    const base = els.map(e => parseFloat(getComputedStyle(e).fontSize));
    while (box.scrollHeight > box.clientHeight + 1 && scale > 0.62) {
      scale -= 0.04;
      els.forEach((e, i) => { e.style.fontSize = (base[i] * scale) + 'px'; });
    }
    return { overflow: box.scrollHeight > box.clientHeight + 1, scale: Math.round(scale * 100) / 100 };
  };
</script>
</body></html>`;
}
