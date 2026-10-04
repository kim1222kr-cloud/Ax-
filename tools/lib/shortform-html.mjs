// 숏폼(9:16) 장면 HTML 생성기. 장면 타입: hook | caption | quote | book | cta
// 인스타 릴스·유튜브 쇼츠 UI가 덮는 영역(상단·하단·우측)을 피해 안전영역 안에만 텍스트를 둔다.
import { esc, lines, rich, fontLinks, assetUrl } from './common.mjs';

export const SCENE_TYPES = ['hook', 'caption', 'quote', 'book', 'cta'];

export function sceneHtml({ brand, track, fmt, spec, scene, idx, total, baseDir, aiVoice }) {
  if (!SCENE_TYPES.includes(scene.type)) {
    throw new Error(`장면 ${idx + 1}: 알 수 없는 type "${scene.type}" (가능: ${SCENE_TYPES.join(', ')})`);
  }
  const c = track.colors;
  const serif = `'${brand.fonts.serif}', serif`;
  const sans = `'${brand.fonts.sans}', 'Pretendard', sans-serif`;
  const display = track.display_font === 'serif' ? serif : sans;
  const bg = assetUrl(scene.image, baseDir);
  const isFirst = idx === 0, isLast = idx === total - 1;
  const showAd = spec.disclosure && (isFirst || isLast); // 영상은 시작·끝 모두 표시
  const cover = assetUrl(scene.cover, baseDir);

  const body = {
    hook: `<div class="hook">${rich(scene.text)}</div>${scene.sub ? `<div class="sub">${lines(scene.sub)}</div>` : ''}`,
    caption: `<div class="cap">${rich(scene.text)}</div>${scene.sub ? `<div class="sub">${lines(scene.sub)}</div>` : ''}`,
    quote: `<div class="qm">“</div><div class="quote">${rich(scene.text)}</div>${scene.source ? `<div class="sub">${esc(scene.source)}</div>` : ''}`,
    book: `<div class="bk">${cover ? '' : `<span>${lines(scene.title)}</span>`}</div><div class="bt">${lines(scene.title || '')}</div>${scene.author ? `<div class="sub">${esc(scene.author)}</div>` : ''}${scene.copy ? `<div class="bc">${rich(scene.copy)}</div>` : ''}`,
    cta: `<div class="cap">${rich(scene.text)}</div><div class="handle">${esc(scene.handle || brand.brand.instagram)}</div>${scene.sub ? `<div class="sub">${lines(scene.sub)}</div>` : ''}`,
  }[scene.type];

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">${fontLinks()}<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { width:${fmt.width}px; height:${fmt.height}px; }
  body { background:${c.bg}; color:${c.ink}; font-family:${sans}; word-break:keep-all; overflow-wrap:anywhere; -webkit-font-smoothing:antialiased; }
  .s { position:relative; width:100%; height:100%; overflow:hidden; background:${c.bg} ${bg ? `url('${bg}') center/cover no-repeat` : ''}; }
  .shade { position:absolute; inset:0; background:${bg ? 'linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.6))' : 'transparent'}; }
  .strip { position:absolute; top:0; bottom:0; width:40px; display:flex; flex-direction:column; justify-content:space-between; padding:20px 0; align-items:center; opacity:.16; }
  .strip.l { left:0; } .strip.r { right:0; }
  .strip i { width:20px; height:34px; border-radius:5px; background:${c.ink}; }
  .safe { position:absolute; left:${fmt.safe_side}px; right:${fmt.safe_side + 40}px; top:${fmt.safe_top}px; bottom:${fmt.safe_bottom}px; display:flex; flex-direction:column; justify-content:center; ${bg ? 'color:#fff;' : ''} }
  .top { position:absolute; top:${fmt.safe_top - 120}px; left:${fmt.safe_side}px; right:${fmt.safe_side}px; display:flex; justify-content:space-between; align-items:center; font-size:30px; color:${bg ? '#fff' : c.muted}; }
  .brand { font-weight:700; letter-spacing:.2em; }
  .ad { font-size:30px; font-weight:800; padding:8px 20px; border-radius:999px; background:${c.ink}; color:${c.bg}; }
  .hl { color:${c.accent}; }
  ${track.highlight === 'marker' && !bg ? `.hl { color:inherit; background:linear-gradient(transparent 56%, ${c.accent}AA 56%, ${c.accent}AA 92%, transparent 92%); padding:0 .06em; }` : ''}
  .hook { font-family:${display}; font-weight:800; font-size:${scene.size || 104}px; line-height:1.25; letter-spacing:-.02em; }
  .cap { font-family:${display}; font-weight:800; font-size:${scene.size || 78}px; line-height:1.38; letter-spacing:-.01em; }
  .quote { font-family:${serif}; font-weight:700; font-size:${scene.size || 70}px; line-height:1.55; }
  .qm { font-family:${serif}; font-size:200px; line-height:.8; height:120px; color:${c.accent}; }
  .sub { margin-top:40px; font-size:40px; line-height:1.5; font-weight:500; color:${bg ? 'rgba(255,255,255,.85)' : c.muted}; }
  .bk { align-self:center; width:520px; height:740px; border-radius:6px 14px 14px 6px; background:${c.surface} ${cover ? `url('${cover}') center/cover no-repeat` : ''}; box-shadow:0 30px 70px rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; padding:40px; text-align:center; font-family:${display}; font-weight:800; font-size:46px; line-height:1.35; }
  .bt { margin-top:60px; text-align:center; font-family:${display}; font-weight:800; font-size:62px; line-height:1.3; }
  .book-wrap .sub, .bc { text-align:center; }
  .bc { margin-top:26px; font-size:42px; font-weight:700; line-height:1.45; }
  .handle { margin-top:48px; display:inline-block; align-self:flex-start; font-size:44px; font-weight:800; padding:18px 34px; border-radius:999px; background:${c.accent}; color:${c.bg}; }
  .ainote { position:absolute; left:${fmt.safe_side}px; right:${fmt.safe_side}px; bottom:${fmt.safe_bottom - 90}px; font-size:26px; color:${bg ? 'rgba(255,255,255,.8)' : c.muted}; }
  </style></head><body><div class="s"><div class="shade"></div>
  <div class="strip l">${'<i></i>'.repeat(24)}</div><div class="strip r">${'<i></i>'.repeat(24)}</div>
  <div class="top">${showAd ? `<span class="ad">${esc(spec.disclosure)}</span>` : `<span class="brand">${esc(brand.brand.name_en)}</span>`}<span>${spec.book_title ? esc(spec.book_title) : ''}</span></div>
  <div class="safe ${scene.type === 'book' ? 'book-wrap' : ''}">${body}</div>
  ${aiVoice && isLast ? `<div class="ainote">${esc(brand.disclosure.ai_voice_note)}</div>` : ''}
  </div>
  <script>
    window.__fit = async () => {
      await document.fonts.ready;
      const box = document.querySelector('.safe');
      const els = [...box.querySelectorAll('*')];
      const base = els.map(e => parseFloat(getComputedStyle(e).fontSize));
      let scale = 1;
      while (box.scrollHeight > box.clientHeight + 1 && scale > 0.62) {
        scale -= 0.04; els.forEach((e, i) => { e.style.fontSize = (base[i] * scale) + 'px'; });
      }
      return { overflow: box.scrollHeight > box.clientHeight + 1, scale: Math.round(scale * 100) / 100 };
    };
  </script></body></html>`;
}
