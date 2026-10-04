---
name: weekly-report
description: 금요일 성과 회고. metrics 수집 → D+7 분석 → 실험 판정 → playbook·hooks 갱신 → 등록부 개정 제안을 만들고 리드가 채택 여부를 정하게 한다. --monthly(매월 첫 금요일)는 브랜드 블라인드 보정과 발행물 5건 사후 감사를 함께 한다.
argument-hint: "[YYYY-Www] [--monthly]"
---

# /weekly-report — 금요 성과 회고와 학습

## 인자 ($ARGUMENTS)
`[YYYY-Www] [--monthly]` — 주차 기본값은 이번 주. --monthly는 매월 첫 금요일.

## 단계
1. 메인 세션이 `npm run metrics -- --since <지난주 월요일 YYYY-MM-DD>`를 실행한다. 인증 실패면 `npm run metrics -- --dry-run`으로 대상 목록만 확인하고, 실패 원인(토큰 만료 등)을 결과 첫머리에 적은 뒤 직전 스냅샷으로 진행한다.
2. content/campaigns/_planning/<week>/account.json({"date","ig_followers","ig_profile_link_taps","yt_subscribers"}, 사람 입력)이 있는지 확인한다. 없으면 입력을 요청하고 해당 지표는 '측정 공백'으로 둔 채 진행한다.
3. **performance-analyst** → _planning/<week>/report.md, playbook.md·hooks.md 갱신, registry-proposals.md 덧붙이기.
4. --monthly면 추가로: **brand-editor**(calibrate) → _planning/calibration-<YYYY-MM>.md / **compliance-gate**(audit) → _planning/audit-<YYYY-MM>.md / `/weekly-plan --calendar` 실행 안내.
5. **사람 게이트(리드 15분) — 멈추고 보여준다**: 5줄 요약(저장률·공유율·팔로워 순증 추이, 최고·최저 캠페인, 실험 판정, 멈출 것 1개, 새로 시험할 것 1개) / 운영 지표(리드타임, 시안 1차 승인율, 건당 /fix 횟수) / 제안별 '채택/보류' 체크박스 / 안내: "claims.json, policy.json, voice-guide.md 반영은 사람이 직접 합니다. 다음 /weekly-plan이 이 report.md를 읽습니다."
