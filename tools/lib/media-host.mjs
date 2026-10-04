// 인스타그램 API는 미디어를 '공개 HTTPS URL'에서 가져간다 → 업로드 후 URL 확보가 필요.
// MEDIA_UPLOAD_CMD 템플릿으로 어떤 저장소든 연결 (aws s3 / rclone / wrangler r2 / gsutil 등)
//   예) MEDIA_UPLOAD_CMD='aws s3 cp "{file}" "s3://feelm-media/{key}" --acl public-read'
//       MEDIA_PUBLIC_BASE_URL='https://media.feelmgroup.com'
// MEDIA_PUBLIC_BASE_URL 이 없으면 명령 stdout 마지막 줄을 URL로 사용한다.
import { spawn } from 'node:child_process';
import path from 'node:path';

function sh(cmd) {
  return new Promise((resolve, reject) => {
    const p = spawn('bash', ['-lc', cmd], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`업로드 실패(${code}): ${err.slice(-400)}`)));
  });
}

export function plannedKey(campaignId, file) {
  return `${campaignId}/${path.basename(path.dirname(file))}/${path.basename(file)}`;
}

export async function uploadPublic(campaignId, file, { dryRun }) {
  const key = plannedKey(campaignId, file);
  const base = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (dryRun) return base ? `${base}/${key}` : `https://<MEDIA_PUBLIC_BASE_URL>/${key}`;
  const tpl = process.env.MEDIA_UPLOAD_CMD;
  if (!tpl) throw new Error('MEDIA_UPLOAD_CMD 가 설정되지 않았습니다(.env.example 참고).');
  const q = s => s.replace(/(["\\$`])/g, '\\$1');
  const out = await sh(tpl.replaceAll('{file}', q(file)).replaceAll('{key}', q(key)));
  if (base) return `${base}/${key}`;
  const last = out.trim().split('\n').pop();
  if (!/^https:\/\//.test(last)) throw new Error('업로드 명령이 공개 HTTPS URL을 출력하지 않았습니다. MEDIA_PUBLIC_BASE_URL 을 지정하세요.');
  return last;
}
