// 한국어 TTS 어댑터. provider: none | elevenlabs | typecast | clova | supertone
// API 키는 .env(환경변수)로만 받는다. 키가 없으면 명확한 오류를 낸다.
// ⚠️ 각 사의 요청 형식은 2026-10 기준 공개 연동 코드로 확인했다. 계약 전 공식 문서와 '광고 이용' 라이선스를 반드시 확인할 것.
import { writeFile } from 'node:fs/promises';

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`TTS 환경변수 ${name} 가 없습니다. .env.example 참고`);
  return v;
}

async function ok(res, provider) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${provider} TTS 실패 (${res.status}): ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// 문장 경계 기준으로 maxLen 이하 조각으로 분할 (Supertone 300자 제한 등)
export function splitText(text, maxLen) {
  const parts = text.match(/[^.!?。…\n]+[.!?。…]*\s*/g) || [text];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > maxLen && cur) { out.push(cur.trim()); cur = ''; }
    cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const providers = {
  async elevenlabs({ text, voice_id, speed }) {
    const id = voice_id || need('ELEVENLABS_VOICE_ID');
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': need('ELEVENLABS_API_KEY'), 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: speed ?? 1.0 },
      }),
    });
    return [await ok(res, 'ElevenLabs')];
  },

  async typecast({ text, voice_id, emotion }) {
    const res = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST',
      headers: { 'X-API-KEY': need('TYPECAST_API_KEY'), 'content-type': 'application/json' },
      body: JSON.stringify({
        voice_id: voice_id || need('TYPECAST_VOICE_ID'),
        text,
        model: process.env.TYPECAST_MODEL || 'ssfm-v30',
        language: 'kor',
        prompt: { emotion_preset: emotion || 'normal' },
        output: { audio_format: 'mp3' },
      }),
    });
    return [await ok(res, 'Typecast')];
  },

  async clova({ text, voice_id, speed }) {
    // NAVER CLOVA Voice Premium. speed: -5(빠름) ~ 5(느림)
    const form = new URLSearchParams({ speaker: voice_id || process.env.CLOVA_SPEAKER || 'nara', text, format: 'mp3', speed: String(speed ?? 0) });
    const res = await fetch('https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
      method: 'POST',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': need('CLOVA_CLIENT_ID'),
        'X-NCP-APIGW-API-KEY': need('CLOVA_CLIENT_SECRET'),
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    return [await ok(res, 'CLOVA Voice')];
  },

  async supertone({ text, voice_id, style }) {
    const id = voice_id || need('SUPERTONE_VOICE_ID');
    const chunks = splitText(text, 290);
    const bufs = [];
    for (const chunk of chunks) {
      const res = await fetch(`https://supertoneapi.com/v1/text-to-speech/${id}`, {
        method: 'POST',
        headers: { 'x-sup-api-key': need('SUPERTONE_API_KEY'), 'content-type': 'application/json' },
        body: JSON.stringify({ text: chunk, language: 'ko', style: style || 'neutral', output_format: 'mp3' }),
      });
      bufs.push(await ok(res, 'Supertone'));
    }
    return bufs;
  },
};

export const TTS_PROVIDERS = ['none', ...Object.keys(providers)];

// 결과: 저장된 mp3 경로 배열 (조각이 여럿이면 여러 개 → ffmpeg에서 이어 붙임)
export async function synthesize({ provider, text, voice_id, speed, emotion, style, outBase }) {
  if (!provider || provider === 'none') return [];
  const fn = providers[provider];
  if (!fn) throw new Error(`알 수 없는 TTS provider "${provider}" (가능: ${TTS_PROVIDERS.join(', ')})`);
  const bufs = await fn({ text, voice_id, speed, emotion, style });
  const paths = [];
  for (let i = 0; i < bufs.length; i++) {
    const p = `${outBase}${bufs.length > 1 ? `-${i}` : ''}.mp3`;
    await writeFile(p, bufs[i]);
    paths.push(p);
  }
  return paths;
}
