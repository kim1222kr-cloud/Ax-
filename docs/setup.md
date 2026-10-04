# 셋업 가이드 (사람이 할 일)

## 1. 설치
```bash
npm install                      # playwright, pretendard, noto-serif-kr, ffmpeg(@ffmpeg-installer)
npx playwright install chromium  # 처음 한 번 (CHROMIUM_PATH 로 기존 크롬 지정도 가능)
npm test                         # 회귀 테스트 전체 통과 확인
cp config/env.example .env       # 값 채우기 (.env 는 git 제외, 에이전트 읽기 금지)
```
Node 22.9 이상(`--env-file-if-exists` 사용).

## 2. 계정·API
| 항목 | 할 일 |
|---|---|
| 인스타그램 | @feelmbook 을 프로페셔널(비즈니스) 계정으로, Meta 앱 생성 → `IG_USER_ID`, 장기 `IG_ACCESS_TOKEN`(만료일 관리). 이미지 공개 호스팅(S3/R2 등) → `MEDIA_UPLOAD_CMD`, `MEDIA_PUBLIC_BASE_URL` |
| 유튜브 | 회사 채널 결정(현재 @feelm_contents 구독 약 25명 — 재가동 또는 신규) → `brand/brand.json` youtube 정정. Google Cloud 프로젝트에서 YouTube Data API OAuth → `YT_CLIENT_ID/SECRET/REFRESH_TOKEN`(scope: youtube.upload, yt-analytics.readonly). **API 감사(audit) 신청** — 통과 전 업로드는 비공개 고정 |
| TTS(선택) | 공급사·보이스 확정 + **광고 이용 라이선스** 확인 전에는 `voice.provider: "none"` 유지 |
| BGM(선택) | 라이선스 파일 확보 전에는 `bgm: null` |

## 3. 데이터 확정
- `data/approvers.json` 승인자 이름(리드·대리·대표·편집부·법무)
- `data/claims.json` 내부 판매자료로 수치 확정
- `data/rights.json` 번역서 원권리사 조건
- `brand/brand.json` 실제 브랜드 컬러·로고·서체(지금은 가안)
- `data/catalog.json` 사내 도서 DB로 보강(현재 웹 리서치 53종)
- `data/authors.json` 크리에이터 저자 계약 조건·연락 창구

## 4. 권한·훅 강화 (권장 — 사람이 `.claude/settings.json` 을 직접 수정)
현재 설정: `FEELM_AGENT=1` env, approve·status.json·policy.json deny, 발행 ask, Bash 게이트 훅(`publish-gate.mjs`).
아래를 추가하면 Edit/Write 도구 경로까지 막힌다(에이전트·스킬을 고칠 때는 잠시 해제):

```jsonc
{
  "permissions": {
    "allow": [ "Bash(npm run catalog:*)", "Bash(npm run check:approval:*)" ],
    "deny": [
      "Edit(data/**)", "Write(data/**)", "Edit(brand/**)", "Write(brand/**)",
      "Edit(templates/**)", "Write(templates/**)", "Edit(tools/**)", "Write(tools/**)",
      "Edit(.claude/**)", "Write(.claude/**)",
      "Read(.env)", "Read(.env.local)", "Read(.env.production)"
    ],
    "disableBypassPermissionsMode": "disable"
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/publish-gate.mjs" } ] },
      { "matcher": "Edit|Write|MultiEdit", "hooks": [ { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/campaign-guard.mjs" } ] }
    ]
  }
}
```
- 기존 deny 의 `Read(.env.*)` 는 위처럼 좁혀도 된다(템플릿은 `config/env.example`).
- 변경 후 `/hooks` 메뉴에서 훅이 보이는지 확인.

## 5. 승인 운영
- 승인은 항상 **Claude Code 밖의 별도 터미널**에서: `npm run approve -- content/campaigns/<id> --stage plan|draft|publish --by "<이름>"`
- 편집부 인용 확인: `--grant quotes --by "<편집부>" --ids q1,q2` / 대표 서사: `--grant ceo_story --by "김상현"` / 법무: `--grant legal`
- 최종 승인 후 재작업: `--reopen --by "<이름>" --note "<사유>"`
- 상태 확인: `npm run check:approval -- content/campaigns/<id>`

## 6. (선택) 자동화
- 성과 수집: 사람 PC의 cron 으로 매일 `npm run metrics`
- 인스타 예약 실행(Phase 2): 사람 소유 cron 이 `publish_approved` 이고 `scheduled_at`이 지난 캠페인만 `npm run publish:ig -- … --live` 실행. 에이전트는 관여하지 않는다.
