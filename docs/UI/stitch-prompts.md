# Google Stitch 프롬프트 세트 — Neon Night Café

- 디자인 시스템: [`docs/UI/design.md`](design.md) (B안 Neon Night Café, DESIGN.md 규격 `alpha`)
- 근거: [Stitch 프롬프트 가이드](https://discuss.ai.google.dev/t/stitch-prompt-guide/83844), [DESIGN.md spec](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md)
- 프롬프트 본문은 Stitch가 가장 잘 따르는 영어로 쓰고, 화면에 나올 텍스트는 한국어 원문 그대로 따옴표로 넣었습니다.
- 프롬프트 하나에 변경 1~2개, 본문 3,000자 이하로 맞췄습니다 (5,000자를 넘으면 요소가 빠진다는 사용자 보고가 있음).

---

## 0. 공통 설정

### 0.1 모드

| 항목 | 값 | 비고 |
|---|---|---|
| app/web | **Web** | 6차(모바일)만 예외 규칙 있음 (6차 참고) |
| 모델 | **Balanced** (Gemini 3.8 Flash) | Stitch 화면에 표시된 이름을 따름 |
| design.md | **사용** — 1차 전에 `docs/UI/design.md` import | 모든 차수에 같은 프로젝트로 유지 |
| 프로젝트 | 1개 프로젝트 안에서 1차 화면을 계속 수정 | 2차부터는 **1차 결과 화면을 선택한 상태**에서 입력 |

### 0.2 첨부 파일 준비

| 파일 | 만드는 방법 | 쓰는 차수 |
|---|---|---|
| `current-desktop.png` | `npm run dev` → 브라우저 폭 1440px → 전체 페이지 캡처 | 1차 |
| `current-mobile.png` | 개발자 도구 기기 모드 390×844 → 전체 페이지 캡처 | 6차 |
| 초상화 3장 | `src/data/characterImages/사키리.png`, `백장.png`, `우미츠키.png` (PNG — Stitch가 webp를 못 받을 수 있어 `src/assets/portraits/*.webp` 대신 사용) | 1차, 4차 |

- 현재 화면 캡처는 **정보 구조 전달용**입니다. 지금의 크림·브라운 색에 끌려가지 않도록 프롬프트에 "색은 무시"라고 명시했습니다.

### 0.3 0차 — design.md 적용 확인 (프롬프트 없음)

1. Stitch에서 새 프로젝트 생성 → Web 모드, Balanced 선택.
2. 디자인 시스템 / DESIGN.md import 메뉴에서 `docs/UI/design.md`를 불러옵니다. (메뉴 위치는 공식 문서에서 확인하지 못함 — 보이지 않으면 1차 프롬프트에 파일을 첨부)
3. 확인: 불러온 테마의 primary가 `#2EF2E2`(네온 시안), 배경이 `#0D0A17`(남색 검정)로 표시되는지.
   - 오류가 나면: 오류 메시지를 그대로 알려 주세요. design.md를 수정하겠습니다.

### 0.4 사용 샘플 데이터

모든 숫자는 현재 데이터로 실제 계산한 값입니다. 조건: 보유 16명 전원 Lv5, 트렌드 「전체 트렌드 평균 (범용)」, 인기도 0.015, 마네키네코 켬, 매출순.

| 순위 | 매출 | 1위 대비 | 차이 | 1위 대비 바뀐 것 |
|---|---|---|---|---|
| 1위 | 2,719.69 | 100.00% | — | 식재료 −272.23 · 순수익 2,447.47 |
| 2위 | 2,718.40 | 99.95% | −1.29 | −백장 Lv5 +민트 Lv5 |
| 3위 | 2,714.76 | 99.81% | −4.93 | −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +다포딜 Lv5 |
| 4위 | 2,713.98 | 99.78% | −5.71 | −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +민트 Lv5 |
| 5위 | 2,711.74 | 99.70% | −7.95 | −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 −백장 Lv5 +민트 Lv5 +아들러 Lv5 |

- 차이 값은 표시 반올림 전 값끼리 뺀 것이라 실제 앱과 ±0.01 다를 수 있습니다.
- 소요 시간 「38ms」는 임의 값입니다.

---

## 1. 평가 방법 (모든 차수 공통)

### 1.1 점수 항목 (각 1~5점)

| 코드 | 항목 | 무엇을 보나 |
|---|---|---|
| A | 구조 | 요청한 요소가 모두 있고, 요청한 위치·순서에 있는가 |
| B | 텍스트·숫자 | 한국어 문구와 숫자가 원문과 글자 하나까지 같은가 (깨짐, 번역, 임의 변경 여부) |
| C | 시각 위계 | 1위 수익 숫자 → 1위 카드 → 순위 행 → 입력 → 부가 정보 순서로 눈이 가는가 |
| D | 토큰 준수 | 색·폰트·모서리가 design.md와 맞는가 — **Claude가 HTML 코드로 평가** (아래 1.3 참고) |
| E | 콘셉트 | 「밤의 카페 거리 + 네온 간판」 느낌이 나면서, 네온이 1~2곳에만 쓰였는가 |
| F | 구현성 | 지금 React 컴포넌트 구조(3단, 카드, 칩, 타일)로 옮기기 쉬운가. 실제로 만들 수 없는 장식이 많지 않은가 |

| 점수 | 기준 |
|---|---|
| 5 | 그대로 써도 됨 |
| 4 | 사소한 수정 1~2개 |
| 3 | 수정 프롬프트 1회 필요 |
| 2 | 큰 결함 (요소 누락, 구조 붕괴) |
| 1 | 재생성 필요 |

### 1.2 통과 기준

- 차수별 **필수 체크**를 모두 통과하고,
- A~F 중 2점 이하가 없고, 평균 3.5점 이상.
- 통과 못 하면: 해당 차수의 「수정 프롬프트」를 1개씩 적용 (한 번에 하나). 2회 수정해도 안 되면 그 차수를 다시 생성합니다.
- 통과한 결과는 **스크린샷을 저장**해 두세요 (가이드 권장: 수정이 앞 결과를 망칠 수 있음).

### 1.3 D(토큰 준수) — Claude 평가

D는 사용자가 눈으로 매기지 않고, Stitch가 내보낸 **HTML 코드**를 Claude에게 주면 Claude가 매깁니다. A·B·C·E·F와 필수 체크는 지금처럼 사용자가 화면을 보고 평가합니다.

**사용자가 할 일**

1. Stitch에서 평가할 화면 선택 → 코드 보기(Code / Export) → HTML 전체 복사.
2. Claude에게 아래처럼 보냅니다. HTML은 길어도 잘라내지 말고 통째로 붙입니다.
   ```
   [N차] D 평가 (다크|라이트)
   <HTML 전체>
   ```
3. Claude가 돌려준 D 점수를 기록 양식(1.4)의 `D토큰` 칸에 옮깁니다.

**Claude가 할 일**

- **토큰 항목만** 평가합니다. 구조·문구·숫자·위계·콘셉트·구현성(A·B·C·E·F)과 필수 체크는 HTML에서 보이더라도 점수를 매기거나 언급하지 않습니다.
- 기준은 `docs/UI/design.md` front matter입니다 (다크는 `colors`, 7차 라이트는 `colors.light`). 아래 표는 요약이며, 표와 design.md가 다르면 design.md를 따릅니다.
- HTML 안의 Tailwind 설정(`tailwind.config`), `<style>`, 인라인 `style`, 클래스(`bg-[#...]`, `rounded-*`, `font-*` 등)를 모두 확인합니다.

| 검사 | 기대 값 | 판정 방법 |
|---|---|---|
| 색 팔레트 | design.md에 있는 색만 사용 | 코드의 모든 hex·rgb 값을 design.md 색과 대조. 목록에 없는 색은 이름·위치와 함께 나열 (투명도만 바꾼 `rgba`는 원래 색이 맞으면 허용) |
| 페이지 배경 | `background` `#0D0A17` | `body` 또는 최상위 래퍼 배경 |
| 패널·카드 | `surface` `#161226` / 1위 카드 `surface-2` `#201A35` / 영수증 `surface-sunken` `#0A0812` | 해당 요소의 배경 |
| 네온 시안 `primary` `#2EF2E2` | 1위 카드 테두리·글로우, 순위 배지, 활성 토글·세그먼트, 비율 숫자(「100.00%」 등), 포커스 링 **에만** | `#2EF2E2`(및 그 rgba)가 쓰인 요소를 모두 나열해 위 목록 밖이면 위반. 글로우(`box-shadow`·`drop-shadow`)는 1위 카드에만 |
| 보라 `secondary` `#A78BFA` | 레벨 배지 | 사용 위치 |
| 태그 칩 | 메인 메뉴 `#FF9A5C` / 디저트 `#FF7EC8` / 음료 `#5CB8FF`, 칩 배경은 각 `-soft` | 칩별 글자·배경색이 태그와 맞는지 |
| ★ 트렌드 | `trend` `#FFD54A` | ★ 표기 색 |
| 순수익 / 식재료 | `positive` `#5CE6A0` / `negative` `#FF5C7A` | 금액 줄·영수증 8번 |
| 텍스트 | `text` / `text-2` / `text-3` 3단계 | 본문·보조·흐린 텍스트 색 |
| 숫자 폰트 | Space Grotesk + `tabular-nums`(`"tnum"`) / 영수증은 JetBrains Mono | 숫자 요소의 `font-family`, `font-variant-numeric` |
| 한글 폰트 | Pretendard (대체로 Noto Sans KR 허용) | 기본 `font-family` |
| 숫자 크기 | 1위 숫자 `display-number` 44px/700 | 1위 숫자 요소의 크기·굵기 |
| 모서리 | `rounded` 6 / 10 / 14 / 20 / 9999px 중 하나 | 모든 `border-radius`·`rounded-*` 값. 목록 밖 값 나열 |

**점수 기준 (D)**

| 점수 | 기준 |
|---|---|
| 5 | 위반 없음 |
| 4 | 목록 밖 값 1~2개, 눈에 띄지 않는 곳 (예: 미세한 회색 차이, 모서리 8px) |
| 3 | 사소한 위반 3개 이상, 또는 폰트 하나가 대체 폰트로 빠짐 |
| 2 | 시안이 지정 위치 밖에 쓰임, 글로우가 2곳 이상, 태그 색이 뒤바뀜, 숫자가 Space Grotesk가 아님 중 하나 |
| 1 | design.md 팔레트가 거의 적용되지 않음 (배경·주색이 다른 색) |

**Claude 응답 형식**

```
[N차] D토큰 _점
위반:
- (요소) (현재 값) → (기대 토큰 이름 · 값)
수정 프롬프트: (위반이 있을 때만, Stitch에 넣을 영어 한두 문장)
```

- HTML에서 확인할 수 없는 항목(예: 외부 CSS로 빠져 있음, 폰트가 실제로 로드되는지)은 「미확정」으로 적고 이유를 답니다. 미확정 항목은 감점하지 않습니다.

### 1.4 기록 양식 (차수마다 복사해서 사용)

```
[N차] 시도 #_  / 날짜:
필수 체크: 통과 _/_  (실패 항목: )
A구조 _ / B텍스트 _ / C위계 _ / D토큰 _(Claude) / E콘셉트 _ / F구현성 _  → 평균 _
판정: 통과 / 수정(적용할 수정 프롬프트: ) / 재생성
메모:
```

---

## 2. 1차 — 데스크톱 전체 화면 (새로 생성)

| 항목 | 값 |
|---|---|
| 목적 | 3단 정보 구조와 콘셉트를 한 번에 잡기 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 새 화면 생성 |
| 첨부 | `current-desktop.png`, 초상화 3장 (사키리·백장·우미츠키) |

**프롬프트** (약 2,600자)

```text
Design a desktop web page (1440px wide) for "별미 카페 계산기", a Korean fan-made calculator for a game's café mini-game. It ranks the most profitable combinations of 5 menu items and up to 10 staff characters. Follow the attached DESIGN.md (Neon Night Café): dark night-café mood, cyan neon only on the #1 result. The attached screenshot shows the current information structure only; ignore its colors. The attached portraits show the character art style; use similar circular portraits or simple silhouettes for the others. All UI text must be Korean exactly as written below.

Layout: slim header (small coffee-cup logo mark + title "별미 카페 계산기"), then 3 columns, max width 1320px.

Left column (320px):
1. Panel "설정": "트렌드" dropdown showing "전체 트렌드 평균 (범용)"; "인기도" input "0.015" with helper "×1.015"; "마네키네코" checkbox (checked) with helper "유동인구 +1%".
2. Panel "보유 캐릭터 16/16" with chip buttons "전체 선택" and "전체 해제", then a 4-column grid of 16 character tiles (portrait, name, tiny level select "5"): 사키리, 라크리모사, 나나리, 민트, 백장, 다포딜, 스키아, 에드가, 신쿠, 링코, 아카네 린, 우미츠키, 하니엘, 아들러, 치즈, 일로이.

Center column (results):
Header "추천 조합", segmented control "매출순 | 순수익순" (매출순 active), meta text "16명 중 10명 선택 · 38ms".
#1 featured card: badge "1위", big number "2,719.69", unit "폰즈/시간 매출", "100.00%". Line: "매출 2,719.69 · 식재료 −272.23 · 순수익 2,447.47". Section "메뉴" with 5 food chips (name, then tag · price ★trend): 뜨거운 오렌지 커피 (음료 · 15 ★5/29), 바삭한 코코넛 쿠키 마끼아또 (음료 · 16 ★6/29), 눈 덮인 말차 라테 (음료 · 16.5 ★5/29), 티라미수 (디저트 · 17 ★5/29), 캐러맬 초코 크레이프 (디저트 · 18 ★5/29). Section "직원 10명" with 10 circular avatars, name below, level badge "5": 사키리, 라크리모사, 백장, 에드가, 신쿠, 링코, 아카네 린, 우미츠키, 하니엘, 일로이. Then a button "대체 가능 직원 (3)" and a collapsed "영수증" toggle.
Below it, 4 collapsed one-line rows:
- 2위 2,718.40 · 99.95% · −1.29 · −백장 Lv5 +민트 Lv5
- 3위 2,714.76 · 99.81% · −4.93 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +다포딜 Lv5
- 4위 2,713.98 · 99.78% · −5.71 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +민트 Lv5
- 5위 2,711.74 · 99.70% · −7.95 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 −백장 Lv5 +민트 Lv5 +아들러 Lv5
Then a wide button "더 보기 (+10)".

Right column (200px), panel "기타": button "🔗 설정 공유 링크"; input "공유 링크 또는 코드" with button "적용"; button "🐞 버그 제보"; small note "기본 유동인구 2400P" / "트렌드 계수 +0.75 (태그 +1.00)"; at the bottom a quiet small link "수동 계산 (테스트용)".
```

**필수 체크**

- [ ] 3단 구성: 왼쪽(설정 + 보유 캐릭터) / 가운데(추천 조합) / 오른쪽(기타)
- [ ] 헤더에 「별미 카페 계산기」, 모드 토글 **없음**
- [ ] 캐릭터 타일 16개, 4열, 이름 16개가 위 목록과 같음
- [ ] 1위 카드: 「1위」, 「2,719.69」, 「폰즈/시간 매출」, 「100.00%」
- [ ] 금액 줄 「매출 2,719.69 · 식재료 −272.23 · 순수익 2,447.47」
- [ ] 음식 칩 5개: 음료 3개는 하늘색, 디저트 2개는 분홍, 각 칩에 금색 ★ 표기
- [ ] 직원 아바타 10명, 레벨 「5」 배지
- [ ] 접힌 행 2위~5위, 숫자가 표와 같음
- [ ] 「더 보기 (+10)」, 「대체 가능 직원 (3)」, 「영수증」이 있음
- [ ] 「수동 계산 (테스트용)」이 오른쪽 열 아래 작은 링크로만 있음

**이번 차수 중점 평가**: A(구조), E(콘셉트). B는 숫자가 틀려도 3차·2차에서 다시 다루므로 2점 이하만 아니면 통과.

**수정 프롬프트 (필요한 것 하나씩)**

- 열이 무너졌을 때: `Keep exactly three columns: left 320px, center fluid, right 200px. Do not change any content.`
- 네온이 과할 때: `Remove the cyan glow from everything except the #1 result card border. Keep other elements flat.`
- 한국어가 영어로 바뀌었을 때: `Restore all UI text to the exact Korean strings from the previous prompt. Do not translate.`
- 헤더에 모드 토글이 생겼을 때: `Remove the mode switch from the header. Manual mode is only the small link "수동 계산 (테스트용)" in the right column.`

---

## 3. 2차 — 1위 카드 다듬기 (수정)

| 항목 | 값 |
|---|---|
| 목적 | 페이지의 초점(1위 카드)과 숫자 위계 확정 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 1차 통과 화면 선택 후 입력 |
| 첨부 | 없음 |

**프롬프트**

```text
On the current screen, refine only the #1 featured result card. Do not change anything else.
1. Make "2,719.69" the largest text on the page (Space Grotesk, tabular figures). Put the "1위" badge on the left of the same line and "100.00%" in cyan on the right; place "폰즈/시간 매출" right under the number in small muted text.
2. Give only this card a thin cyan neon border with a soft outer glow, on a slightly lighter surface than the other cards. In the line "매출 2,719.69 · 식재료 −272.23 · 순수익 2,447.47", show "순수익 2,447.47" in green and "식재료 −272.23" in a muted red.
```

**필수 체크**

- [ ] 「2,719.69」가 화면에서 가장 큰 글자
- [ ] 「1위」 배지, 「100.00%」(시안)가 숫자와 같은 줄
- [ ] 글로우가 1위 카드에**만** 있음
- [ ] 순수익은 초록, 식재료는 옅은 빨강
- [ ] 메뉴 칩 5개, 직원 10명, 버튼이 1차와 똑같이 남아 있음 (사라짐 없음)
- [ ] 왼쪽·오른쪽 열이 바뀌지 않음

**이번 차수 중점 평가**: C(위계), D(토큰 — HTML을 Claude에게 보내 평가, 1.3).

**수정 프롬프트**

- 다른 요소가 바뀌었을 때: `Revert every change outside the #1 card. Only the #1 card should differ from the previous version.`
- 숫자가 작을 때: `Increase "2,719.69" to about 44px bold. Keep everything else the same size.`

---

## 4. 3차 — 접힌 순위 행 (수정)

| 항목 | 값 |
|---|---|
| 목적 | 2위 이하를 한 줄로 비교하기 쉽게 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 2차 통과 화면 선택 후 입력 |
| 첨부 | 없음 |

**프롬프트**

```text
On the current screen, refine only the collapsed result rows for 2위 to 5위. Do not change the #1 card or the side columns.
1. Each row is one line, left to right: rank badge, income (tabular figures), share of #1 in cyan, difference in muted red, then small change chips, and a "▸" chevron at the far right. Change chips: "−" items are dimmed with strikethrough, "+" items are normal; food chips keep their tag color (티라미수 pink, 햄 치즈 크루아상 orange), staff chips are neutral. Rows:
- 2위 2,718.40 · 99.95% · −1.29 · −백장 Lv5 +민트 Lv5
- 3위 2,714.76 · 99.81% · −4.93 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +다포딜 Lv5
- 4위 2,713.98 · 99.78% · −5.71 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 +민트 Lv5
- 5위 2,711.74 · 99.70% · −7.95 · −티라미수 +햄 치즈 크루아상 −라크리모사 Lv5 −백장 Lv5 +민트 Lv5 +아들러 Lv5
2. Align income, percentage and difference in fixed-width columns so the digits line up vertically across all rows. Change chips may wrap to a second line inside the row on narrow widths.
```

**필수 체크**

- [ ] 4개 행 모두 한 줄 (5위만 칩이 줄바꿈되는 것은 허용)
- [ ] 금액·비율·차이 숫자가 세로로 정렬됨
- [ ] 「−」 칩은 흐림 + 취소선, 「+」 칩은 보통
- [ ] 「티라미수」 분홍, 「햄 치즈 크루아상」 주황, 직원 칩은 무채색
- [ ] 각 행 오른쪽 끝에 「▸」
- [ ] 1위 카드와 양옆 열이 2차와 같음

**이번 차수 중점 평가**: B(숫자), C(위계).

**수정 프롬프트**

- 정렬이 안 맞을 때: `Put income, percentage and difference in three fixed-width right-aligned columns in every row.`
- 칩 색이 틀렸을 때: `Food change chips use their tag colors: 티라미수 = dessert pink, 햄 치즈 크루아상 = main-menu orange. Staff chips stay neutral gray.`

---

## 5. 4차 — 왼쪽 열: 캐릭터 그리드 상태 (수정)

| 항목 | 값 |
|---|---|
| 목적 | 보유/미보유 타일 상태와 레벨 선택의 모양 확정 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 3차 통과 화면 선택 후 입력 |
| 첨부 | 초상화 3장 (1차와 같음) |

**프롬프트**

```text
On the current screen, refine only the "보유 캐릭터" panel in the left column.
1. Show two tile states. Owned tiles (14): cyan-tinted surface, full-color portrait, name, and a tiny level select showing "5". Not-owned tiles (나나리, 치즈): desaturated portrait at low opacity, dimmed name, disabled level select. Update the panel title to "보유 캐릭터 14/16" and the results meta text to "14명 중 10명 선택 · 38ms".
2. Keep the 4-column grid; make each tile compact (portrait about 48px) so all 16 tiles fit without the panel scrolling on a 900px-tall window. Show a cyan focus ring on 사키리 to demonstrate keyboard focus.
```

**필수 체크**

- [ ] 「보유 캐릭터 14/16」, 결과 상단 「14명 중 10명 선택 · 38ms」
- [ ] 나나리·치즈만 흐린 상태, 레벨 선택도 비활성
- [ ] 나머지 14명은 시안 톤 배경 + 레벨 「5」
- [ ] 4열 × 4행, 16개가 한 화면에 보임
- [ ] 사키리 타일에 시안 포커스 링
- [ ] 결과 카드·행 내용은 바뀌지 않음 (숫자 그대로)

**이번 차수 중점 평가**: A(상태 구분), F(구현성 — 현재 `.tile.on` / `.tile` 구조와 맞는가).

**참고**: 나나리·치즈를 빼도 상위 5개 결과는 같습니다 (둘 다 상위 5개 조합에 없음). 「대체 가능 직원 (3)」의 개수는 바뀔 수 있으나 이번 차수에서는 평가하지 않습니다 (미확정: 다시 계산하지 않음).

**수정 프롬프트**

- 미보유가 구분이 안 될 때: `Make not-owned tiles clearly inactive: grayscale portrait at 35% opacity and gray name.`
- 타일이 커서 넘칠 때: `Shrink tiles so the 4x4 grid fits in the panel without scrolling. Keep names on one line, truncate with ellipsis.`

---

## 6. 5차 — 영수증 펼친 상태 (수정)

| 항목 | 값 |
|---|---|
| 목적 | 계산 과정(영수증) 패널 디자인 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 4차 통과 화면 선택 후 입력 (가능하면 「Duplicate / variant」로 복제해 펼친 상태 화면을 따로 만듦) |
| 첨부 | 없음 |

**프롬프트**

```text
Show the #1 card with its "영수증" section expanded. Do not change anything else.
1. The receipt is a sunken panel with monospace tabular numbers, labels left and values right-aligned, and 8 numbered sections:
"1. 유동인구": 기본 유동인구 2,400P / 합연산 (P): 백장 Lv1 +18P, 백장 Lv5 +27P, 에드가 Lv1 +18P … (one row per effect) / 곱연산 (%): 마네키네코 +1%, 우미츠키 Lv2 +1% [음료 2개 이상 ✓], 우미츠키 Lv5 +1.5% [음료 2개 이상 ✓] / total row "(2,400 + 297) × (1 + 3.5%)" 2,791.39P / "유동인구 계수 (÷100)" 27.91.
"2. 판매가 버프": 합연산 +1.56폰즈, 곱연산 +5.5%, rows like "신쿠 Lv1 +0.3폰즈 [음료 3개 이상 ✓]".
"3. 음식별": per food, e.g. "캐러맬 초코 크레이프 18 + 1.56 + 0.03 = 19.59 → × (1 + 5.5%) → + 0.10 = 20.78".
"4. 총 음식 계수" 95.99. "5. 인기도" ×1.015. "6. 매출" 95.99 × 27.91 × 1.015 = 2,719.69.
"7. 식재료": 소모 감소 −19% → 배율 0.81, rows like "커피 원두 10개 · 2.26/시간 × 24 = 54.26", total 272.23.
"8. 순수익" 2,719.69 − 272.23 = 2,447.47 (green).
2. Show one example of an unmet effect dimmed with "✗ 미충족" in section 2, e.g. "사키리 Lv5 +0.3폰즈 [동일 태그 3개 이상 ✗ 미충족]".
```

**필수 체크**

- [ ] 1~8번 섹션이 순서대로 모두 있음
- [ ] 값이 오른쪽 정렬, 고정폭 숫자
- [ ] 1번 최종 「2,791.39P」, 「27.91」 / 6번 「2,719.69」 / 7번 「272.23」 / 8번 「2,447.47」(초록)
- [ ] 미충족 줄이 흐리게 보이고 「✗ 미충족」 표기
- [ ] 영수증이 1위 카드 안에 있고, 카드 밖 요소는 그대로

**이번 차수 중점 평가**: B(숫자), F(구현성 — 줄 단위 리스트로 옮길 수 있는가).

**참고**: 2번의 미충족 예시는 **디자인 확인용 가상 행**입니다. 실제 1위 조합은 음료 3개라 사키리 Lv5 조건을 충족합니다.

**수정 프롬프트**

- 영수증이 너무 길어 카드가 망가질 때: `Limit each receipt section to at most 4 visible rows and add a small "…" row. Keep the 8 section headings.`
- 숫자가 정렬되지 않을 때: `Use a monospace tabular font for all receipt numbers and right-align values in one column.`

---

## 7. 6차 — 모바일 화면 (새 화면)

| 항목 | 값 |
|---|---|
| 목적 | 900px 미만 1단 레이아웃 확인 |
| 모드 | **Web** 모드에서 아래 프롬프트로 390px 화면 요청 → 데스크톱 폭으로 나오면 **같은 프로젝트에서 App 모드**로 바꿔 다시 생성 |
| 대상 | 새 화면 생성 (데스크톱 화면은 그대로 둠) |
| 첨부 | `current-mobile.png` |

**프롬프트**

```text
Create a mobile version (390px wide) of the current screen, using the same DESIGN.md and the same Korean content. The attached screenshot shows the current mobile order only; ignore its colors.
1. Single column in this order: header ("별미 카페 계산기") → "설정" panel → "보유 캐릭터 16/16" panel (tiles in an auto-fill grid of about 68px, 5 per row) → "추천 조합" with the #1 featured card and collapsed rows 2위–5위 → "더 보기 (+10)" → "기타" panel with the "수동 계산 (테스트용)" link at the very bottom.
2. In the #1 card, wrap the 5 food chips into two columns and the 10 staff avatars into two rows of 5. In collapsed rows, keep rank, income and percentage on the first line and move the change chips to a second line.
```

**필수 체크**

- [ ] 실제로 좁은 세로 화면(약 390px)으로 생성됨
- [ ] 순서: 헤더 → 설정 → 보유 캐릭터 → 추천 조합 → 더 보기 → 기타
- [ ] 가로 스크롤이 생길 만한 넘침 없음
- [ ] 1위 숫자 「2,719.69」가 여전히 화면에서 가장 큼
- [ ] 순위 행: 1줄째 순위·금액·비율, 2줄째 변경 칩
- [ ] 터치 대상(버튼·타일)이 너무 작지 않음 (약 40px 이상)

**이번 차수 중점 평가**: A(순서), F(구현성 — 현재 CSS가 900px 기준 1단으로 바뀌는 구조와 맞는가).

**수정 프롬프트**

- 데스크톱 폭으로 나왔을 때: App 모드로 바꿔 같은 프롬프트를 다시 입력.
- 캐릭터 패널이 너무 길 때: `Make the "보유 캐릭터" grid 6 tiles per row with 44px portraits.`

---

## 8. 7차 — 라이트 테마 (수정)

| 항목 | 값 |
|---|---|
| 목적 | `prefers-color-scheme: light`용 색 확인 |
| 모드 | Web / Balanced / design.md 적용 |
| 대상 | 2~5차를 반영한 데스크톱 화면을 **복제한 뒤** 복제본에 입력 (다크 원본 보존) |
| 첨부 | 없음 |

**프롬프트**

```text
Switch this screen to the light theme defined in DESIGN.md under colors.light. Change colors only; keep layout, text, sizes and spacing identical.
Keep the same roles: teal primary only on the #1 card border, rank badges, active toggle and percentages (replace the neon glow with a subtle teal border and soft shadow), violet level badges, and the three distinct tag colors (메인 메뉴 orange, 디저트 pink, 음료 blue) with light tinted chip backgrounds.
```

**필수 체크**

- [ ] 배경 `#F6F4FB` 계열, 카드 흰색, 강조색은 청록 `#00706B`
- [ ] 레이아웃·문구·숫자가 다크 버전과 같음
- [ ] 글로우 대신 얇은 청록 테두리 + 옅은 그림자
- [ ] 태그 3색이 밝은 배경에서도 구분되고 읽힘
- [ ] 회색 보조 텍스트(「16명 중 10명 선택」 등)가 흐려서 안 읽히는 곳 없음

**이번 차수 중점 평가**: D(토큰 — HTML을 Claude에게 「라이트」로 보내 평가, 1.3), 대비(읽힘).

**수정 프롬프트**

- 다른 게 바뀌었을 때: `Revert all layout and text changes. Only colors may differ from the dark version.`

---

## 9. 다음 단계

- 7차까지 통과한 화면 스크린샷(데스크톱 다크·라이트, 영수증, 모바일)을 공유해 주시면, design.md 토큰을 `src/styles.css` 변수로 옮기고 컴포넌트에 반영하는 작업을 브랜치에서 진행합니다.
- Stitch에서 design.md를 수정했다면 export해서 이 파일을 덮어쓰고 알려 주세요.
- 현재 코드와 다른 점: 헤더의 「최적화 / 수동」 토글을 없애고 「수동 계산 (테스트용)」 링크로 옮기는 안입니다 (SPEC 3.2 「눈에 잘 띄지 않게」에 맞춤). 구현 단계에서 반영합니다.
