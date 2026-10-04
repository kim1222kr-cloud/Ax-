# 리허설 예시 — `/make` 결과물 (2026-10-14-heman-sentence)

2026-10-04, 실제 캠페인 `content/campaigns/2026-10-14-heman-sentence`(기획 승인 대기)를 **스크래치 폴더에 복사**해 기획 승인을 '리허설 픽스처'로 가정하고 `/make` 파이프라인을 돌린 결과입니다. **실제 승인은 없었고**, 승인 기록 파일은 이 폴더에 포함하지 않았습니다. 이름이 `_`로 시작하므로 `/make --week`·catalog·metrics 스캔에서 제외됩니다.

| 단계 | 에이전트 | 결과 | 파일 |
|---|---|---|---|
| 권리 장부 | rights-liaison | 자산 0·인용 0 (표지·편집부 인용 미제공) → 책 제목 문장만 사용 | assets/manifest.json, assets/quotes.json, review/rights.md |
| 저자 점검 | trend-scout | 김상현 '낮음'(최근 30일 논란 0건). 10-10 만료 → G3 전 재점검 필요 | ../_planning/author-check/kim-sanghyun-2026-10-04.md |
| 카피 | copy-director | 캐러셀 6장·숏폼 6장면(17.2초), 자체 lint 1회차 오류 0·경고 0 | cardnews.json, shortform.json, review/copy-notes.md |
| 렌더 | render-producer | 넘침 0·축소 0, hook 2.6초 | out/ (gitignore) → docs/images/rehearsal-*.jpg |
| 검수 | compliance-gate | **PASS** (그린 6+3항목), 정책 제안 4건 → 모두 반영 | review/review.md, review/approval-request.md |
| 브랜드 | brand-editor | **통과, 평균 4.0** (② 두 번째 훅 3점 — 1장 제목이 답을 먼저 공개) | review/brand.md |

리허설에서 나온 개선(반영 완료): '책 제목' 라벨 인용은 실제 도서 제목과 대조 · essay 보조 텍스트 대비 4.5:1 · 숏폼 장면 컨택트 시트 생성 · 레드 최종 승인자=대표 검증 · `check:approval`에 저자 점검 만료 경고 · 대표 저서 광고 표기 기준 명문화.
