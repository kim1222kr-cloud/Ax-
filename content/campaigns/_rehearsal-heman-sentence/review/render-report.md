# 렌더 리포트: 2026-10-14-heman-sentence (리허설)

- 작성: render-producer · 2026-10-04
- 경로: 스크래치 리허설 폴더. 실제 content/campaigns 아님
- 착수 조건: status.json stage = `plan_approved`. plan 기록 by "rehearsal-fixture"는 리허설 픽스처이고 실제 승인이 아니다. status.json은 Read로 읽기만 했다.
- 실행 명령(2회)
  - `npm run render:card -- <리허설 경로>`
  - `npm run build:short -- <리허설 경로> --no-tts`
  - `--allow-overflow`는 쓰지 않았다.
- JSON 수정: **없음**. 넘침과 자동축소가 없어서 형식 수정이 필요 없었다.

## 1. 카드뉴스 (card_4x5, 1080×1350)

| # | type | 결과 | 축소율 | 넘침 |
|---|---|---|---|---|
| 01 | cover | ✅ | 100% (축소 없음) | 없음 |
| 02 | text | ✅ | 100% | 없음 |
| 03 | quote | ✅ | 100% | 없음 |
| 04 | text | ✅ | 100% | 없음 |
| 05 | book | ✅ | 100% | 없음 |
| 06 | cta | ✅ | 100% | 없음 |

- 총 6장(상한 10장 이내), 최저 축소율 100%
- 산출물: out/cardnews/01~06.jpg·png, contact-sheet.jpg

## 2. 숏폼 (short_9x16, 1080×1920)

| # | type | 길이 | 결과 |
|---|---|---|---|
| 01 | hook | 2.6초 | ✅ |
| 02 | caption | 2.8초 | ✅ |
| 03 | caption | 2.8초 | ✅ |
| 04 | quote | 3.2초 | ✅ |
| 05 | book | 3.2초 | ✅ |
| 06 | cta | 2.6초 | ✅ |

- 총 **17.2초**, 6장면
  - 목표 15~60초 안이고, 기획안 15~20초에도 맞는다.
  - 첫 hook 2.6초로 3초 이내다.
- TTS: **무음**. voice.provider "none"이고 `--no-tts`로 빌드했다.
  - 기획안대로 voice를 쓰지 않는 구성이며, 키 오류로 인한 대체가 아니다.
  - 그래서 AI 음성 고지 대상이 아니다.
- BGM: 없음(bgm null)
- cover_scene: 0 (hook)
- captions.srt: 6개 큐가 장면 텍스트와 일치한다. 시간 범위는 0.000–17.150초다.
- 산출물: out/shortform/short.mp4, cover.jpg, captions.srt

## 3. 육안 점검 메모

Read로 연 파일: contact-sheet.jpg, 01·03·05·06.jpg, shortform/cover.jpg

- **광고 배지**: disclosure null, sponsored false라 배지 대상이 아니다. 실제로 배지 없이 렌더됐다.
- **대비·가독성**
  - 제목(ink #2A2724)과 강조(accent #B5523B)는 대형 세리프라 모바일에서도 선명하다.
  - subtitle·body·출처 줄은 muted #7A7066으로, bg #F5EFE4 대비 약 4.2:1이다. 읽을 수는 있지만 소형 텍스트 AA 4.5:1에는 조금 못 미친다(토큰 제안 1 참고).
- **장마다 메시지 하나**: 아래와 같이 장마다 하나씩이다. 숏폼 장면도 같은 흐름이다.
  1. cover: 확언형 훅
  2. text: 공감 상황
  3. quote: 책 제목 문장
  4. text: 2인칭 해석
  5. book: 책 소개 문구
  6. cta: 저장·공유
- **표지 노출**
  - book 장(05)은 표지 자산이 없다. manifest files가 비어 있어 제목 타이포 플레이스홀더(흰 판형 + "헤맨 만큼 내 땅이다")로 렌더됐다.
  - 기획안에서 예상한 동작이며, 오류나 넘침은 아니다.
  - 한국어판 표지를 assets/cover.*에 넣고 rights-liaison이 manifest에 등록하면 cover 경로를 연결해 재렌더한다.
- **출판사 표기**
  - 모든 장 상단에 FEELM, 하단에 @feelmbook이 있다.
  - quote 장 하단에 "『헤맨 만큼 내 땅이다』 작가 김상현 · 필름"이 있다.
  - book 장에 "작가 김상현 지음 · 필름"이 있다.
  - 숏폼 cta handle은 "필름 출판사"다.
- **릴스·쇼츠 UI 안전영역** (cover.jpg 기준)
  - 본문 훅 텍스트는 y≈750~980으로 안전하다.
  - 상단 헤더(FEELM / 책 제목)는 y≈118로 상단 220px 구간 안에 있어 플랫폼 UI에 가려질 수 있다. 장식·브랜드 요소이고 핵심 메시지는 아니어서 불통과 사유로 보지 않았다(토큰 제안 2 참고).
  - 하단 420px 구간에는 텍스트가 없다.
- **확인하지 못한 범위**: 숏폼 2~6장면 프레임은 이미지로 확인하지 못했다. 허용된 Bash가 렌더 명령 두 개뿐이라 프레임을 추출할 수 없었다. 렌더러 ✅와 captions.srt 일치로 갈음했고, G2 시안 검토 때 사람이 short.mp4를 재생해 확인해야 한다.
- AI 이미지: 사용하지 않음. 외부 핫링크와 blocked 자산도 없다.

## 4. copy-director 반환

- 없음. 단어·문장·인용·캡션·표기 문구를 바꿀 필요가 생기지 않았다.

## 5. 디자인 토큰 개선 제안 (제안만, brand/·templates/·tools/는 수정하지 않음)

1. **essay muted 대비**: #7A7066를 #6B6158 정도로 조금 어둡게 하면 bg #F5EFE4 대비가 소형 텍스트 AA 4.5:1 이상이 된다. 대상은 subtitle, body, 출처 줄, 저자 줄이다.
2. **숏폼 상단 헤더 위치**: short_9x16 헤더(브랜드 워드마크, 책 제목)가 y≈118로 safe_top 220 안에 있다. 헤더 기준선을 safe_top 아래(y≥240)로 내리거나, 가려져도 되는 장식으로 명시하는 것을 제안한다.
3. **표지 플레이스홀더**: 표지 자산이 없을 때 흰 판형이 화면의 절반 이상을 차지해 비어 보인다. 플레이스홀더 크기를 줄이거나 bg 톤에 line 테두리만 두는 스타일을 제안한다. 근본 해결은 실제 표지 자산을 확보하는 것이다.

## 완료 보고

통과 | 카드 6장 · 숏폼 6장면 17.2초 | 최저 축소율 100%(축소 없음) | copy-director 반환 없음 | out/cardnews/contact-sheet.jpg, out/shortform/short.mp4, out/shortform/cover.jpg
