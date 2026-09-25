# PTS — Personal Token System

개인 스터디 프로젝트. 디자인 토큰 모노레포를 공부하면서 나만의 토큰 파이프라인을 만든다.

## Tech Stack

- Package Manager: npm (workspaces)
- Token Format: DTCG (W3C Design Token Community Group)
- Build Tool: Terrazzo (`@terrazzo/cli` + 플랫폼별 plugin)
- Language: TypeScript

## Structure

```
pts/
├── docs/adr/                    # 의사결정 기록 (English)
└── packages/
    ├── tokens/                  # @pts/tokens — DTCG 소스, SSoT
    │   └── src/
    │       ├── primitive.tokens.json
    │       └── semantic/
    │           ├── spacing.tokens.json   # space, layout
    │           ├── border.tokens.json    # radius, stroke
    │           └── typography.tokens.json # font-*, line-height, letter-spacing, text
    └── css/                     # @pts/css — CSS custom properties
        ├── terrazzo.config.ts
        └── dist/tokens.css      # 빌드 결과 (gitignore)
```

- 새 패키지는 `packages/<name>`에 `@pts/<name>`으로 추가한다. 출력 패키지는 `@pts/tokens`에 의존한다.
- 새 토큰 파일을 만들면 출력 패키지의 `terrazzo.config.ts` `tokens` 목록에도 추가한다.

## Commands

- `npm run build`: 모든 workspace 빌드 (`@pts/css` → `packages/css/dist/tokens.css`)

## Token 규칙

- **계층**: primitive → semantic. semantic은 primitive만 참조한다. 예외: 합성 토큰(`text/*`)은 같은 semantic의 속성 토큰을 참조한다. component 계층은 필요할 때 추가한다.
- **그룹 이름**: primitive와 semantic의 최상위 그룹 이름은 겹치지 않게 한다 (Terrazzo가 모든 파일을 한 네임스페이스로 합침). 예: primitive `weight` ↔ semantic `font-weight`
- **파일**: primitive는 한 파일에 둔다. semantic은 카테고리별로 `semantic/<category>.tokens.json`에 나눈다.
- **포맷**: 모든 토큰에 `$type`을 명시한다. 그룹 단위 `$type` 상속은 쓰지 않는다.
- **dimension**: 단위는 `px`, 객체 형태로 쓴다. `{ "value": 16, "unit": "px" }`
- **alias**: 파일과 상관없이 최상위 그룹부터 참조한다. `"{dimension.16}"`
- **네이밍**: kebab-case.
  - primitive `dimension/N`: N은 px 값. 예외로 `dimension/max` = 9999px
  - primitive `typeface/<font-name>`: 폰트 스택 배열 (fallback 포함)
  - primitive `weight/N`: font-weight 숫자 값 (400, 500, 600, 700)
  - primitive `ratio/N`: N = 값 × 100 (예: `ratio/150` = 1.5)
  - semantic `space/N`: px = N ÷ 25 (예: `space/400` = 16px). 범위 `space/0 – 800`(0–32px), 컴포넌트 내부 간격용
  - semantic `layout/N`: 100 단위 **단계 번호**(px와 무관), 40px 이상 큰 간격. 100=40, 200=48, 300=64. 사이값은 150처럼 끼워 넣는다
  - semantic `radius`: **티셔츠 사이즈**. none=0, xs=2, sm=4, md=8, lg=12, xl=16, `full`=max
  - semantic `stroke`: **굵기 이름**. thin=1, thick=2, thicker=4. 0 값 토큰은 두지 않는다 (테두리 없음은 border 제거로 표현)
  - semantic `font-family`: sans, serif, mono (IBM Plex)
  - semantic `font-weight`: regular, medium, semibold, bold
  - semantic `font-size/N`: 100 단위 **단계 번호**, 400=16px(본문 기본). 100=10 … 1000=48
  - semantic `line-height`: **배수(unitless)**. tight=1.2, normal=1.5, loose=1.75
  - semantic `letter-spacing`: normal=0
  - semantic `text/<role>-<size>`: `$type: typography` 합성 토큰. 역할 display, heading, body, label, caption, code × 크기 lg, md, sm. 5개 속성(fontFamily, fontSize, fontWeight, letterSpacing, lineHeight)을 모두 채운다

토큰 구조를 바꾸는 결정은 ADR로 남긴다 (`docs/adr/NNNN-kebab-case-title.md`).

## 보류 중

- Figma 동기화 방식
- CSS 외 플랫폼 출력

## Git Convention

- **main**: 안정된 상태
- **feature/xxx**: 작업 브랜치
- 릴리스: 태그 기반 (`v1.0.0`)
