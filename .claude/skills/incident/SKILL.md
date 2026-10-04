---
name: incident
description: 발행물에 문제가 생겼을 때(광고 표기 누락, 수치 오류, 저자 논란, '바이럴' 지적 등) 사실 수집, 사람이 할 즉시 조치 체크리스트, 원인 분류, 대응문 초안(대표 승인), 재발 방지 제안까지 빠르게 만든다. 에이전트에게는 삭제·비공개 권한이 없다.
argument-hint: "<campaign-id|permalink> \"<지적 내용>\""
---

# /incident — 발행물 이슈 대응

## 인자 ($ARGUMENTS)
`<campaign-id | permalink> "<지적 내용>"`

## 단계
1. **사실 수집**(메인 세션): 해당 캠페인 status.json의 published[](permalink, 발행 시각), 지적 원문과 발견 시각, 같은 저자·같은 포맷의 예약분(유튜브 publishAt이 미래인 것, stage가 publish_approved이고 scheduled_at이 미래인 것)을 Glob·Read로 목록화.
2. **즉시 조치 체크리스트를 먼저 보여준다**(사람이 앱·Studio에서 직접): 인스타그램 게시물 보관·숨김 / 유튜브 예약 공개 취소·비공개 전환 / 같은 저자의 예약분 보류 / 댓글 대응 보류.
3. **compliance-gate**(incident 모드) → 원인 분류와 같은 원인이 남은 예약분.
4. 저자 이슈면 **trend-scout**(author-check) → 사실관계와 출처.
5. 메인 세션이 content/campaigns/_planning/incidents/<YYYY-MM-DD>-<id>.md를 쓴다: 타임라인, 원인, 조치, 대응문 초안(사실 → 조치 → 재발 방지 순, 변명·축소 표현 금지), '대표 승인 필요' 표시.
6. 재발 방지책(policy.json 패턴 추가, tools/test 회귀 테스트)을 _planning/registry-proposals.md에 덧붙인다. 반영은 사람이 한다.
7. **멈추고 보여준다**: 사람 조치 체크리스트, 대응문 초안, 대표 승인 요청, 보류할 예약분 목록.
