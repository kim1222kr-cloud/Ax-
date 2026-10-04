---
name: fix
description: 리드나 대표의 피드백(반려 사유)을 받아 수정 → 재렌더 → 재검수 → 재승인 요청까지 진행한다. 피드백 원문은 review/feedback.md에 반려 기록으로 남긴다. 최종 승인 이후에는 사람이 --reopen 하기 전까지 진행하지 않는다.
argument-hint: "<campaign-id> \"<피드백>\""
---

# /fix — 사람 피드백 반영(반려 경로)

## 인자 ($ARGUMENTS)
`<campaign-id> "<피드백 원문>"`

## 단계
1. status.json을 Read한다. stage가 publish_approved·published면 멈추고 알린다: "최종 승인 이후에 수정하면 잠금이 깨져 재승인이 필요합니다(가드·게이트 훅이 수정을 막습니다). 재작업하려면 담당자가 별도 터미널에서 먼저 재오픈하세요: `npm run approve -- content/campaigns/<id> --reopen --by "<이름>" --note "<사유>"`". 사람이 재오픈하기 전에는 진행하지 않는다.
2. review/feedback.md에 피드백을 그대로 덧붙인다: `- <YYYY-MM-DD HH:mm> | 단계: <현재 stage> | 출처: 사용자 메시지 | "<원문>"` (이 파일이 반려 기록이다).
3. 분류
   - 문구·훅·CTA·캡션·해시태그 → copy-director
   - 줄바꿈·크기·슬라이드 분할·길이·이미지 교체 → render-producer
   - 정책·표기 질문 → compliance-gate
   - 자산·인용·저자 동의 → rights-liaison
   - 기획 변경(포맷·티어·도서·유료 여부)이면 멈추고 '재기획(/weekly-plan) 필요'로 안내한다.
4. 해당 에이전트를 호출한 뒤 render-producer로 재렌더한다.
5. compliance-gate로 재검수(필요하면 brand-editor도)하고 approval-request.md를 갱신한다. 수정 루프는 /make와 같은 규칙으로 최대 2회.
6. 보여줄 것: 슬라이드·장면별 변경 전후 요약 / 다시 받아야 할 승인(draft 승인 이후 수정이면 시안 재승인 → 최종 승인 순서) / 별도 터미널 명령.
