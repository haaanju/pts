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
├── .githooks/pre-commit         # 커밋 전 npm run check
├── docs/adr/                    # 의사결정 기록 (English)
└── packages/
    ├── tokens/                  # @pts/tokens — DTCG 소스, SSoT
    │   ├── scripts/check.ts     # 토큰 검증 (npm run check)
    │   └── src/
    │       ├── pts.resolver.json         # 토큰 파일 조합 + theme 모드 정의 (빌드 진입점)
    │       ├── primitive/
    │       │   ├── dimension.tokens.json   # dimension
    │       │   ├── typography.tokens.json  # typeface, weight, ratio
    │       │   ├── palette.tokens.json     # palette (black-alpha 포함)
    │       │   └── motion.tokens.json      # duration, easing
    │       └── semantic/
    │           ├── spacing.tokens.json   # space, layout
    │           ├── border.tokens.json    # radius, stroke, focus-ring
    │           ├── typography.tokens.json # font-*, line-height, letter-spacing, text
    │           ├── size.tokens.json      # size (icon, control)
    │           ├── breakpoint.tokens.json
    │           ├── motion.tokens.json    # motion (duration, easing)
    │           ├── z-index.tokens.json
    │           ├── color.{light,dark}.tokens.json  # color (theme별)
    │           └── shadow.{light,dark}.tokens.json # shadow (theme별)
    ├── css/                     # @pts/css — CSS custom properties
    │   ├── terrazzo.config.ts
    │   └── dist/tokens.css      # 빌드 결과 (gitignore)
    └── storybook/               # @pts/storybook — 토큰 문서 (Storybook 10, React + Vite)
        ├── .storybook/          # main, preview (tokens.css 로드, 문서 화면은 light 고정)
        └── src/
            ├── tokens.ts        # resolver를 읽어 테마별로 alias를 풀어주는 데이터 계층
            ├── components.tsx   # 문서 블록 (TokenTable, Palette, ForegroundTable …)
            └── *.mdx            # 카테고리별 문서 페이지
```

- 새 패키지는 `packages/<name>`에 `@pts/<name>`으로 추가한다. 출력 패키지는 `@pts/tokens`에 의존한다.
- 새 토큰 파일을 만들면 `pts.resolver.json`에 추가한다. 모드와 무관하면 `sets.base`, 모드별 값이면 `modifiers`의 해당 context에 넣는다.
- 모드별 파일(`color.light` / `color.dark`)은 **같은 토큰 이름 집합**을 가져야 한다.

## Commands

- `npm run check`: 토큰 검증 (`packages/tokens/scripts/check.ts`). `$type` 누락, 끊긴 alias, 모드 간 토큰 이름 불일치, 컬러 대비를 테마별로 확인한다. pre-commit hook(`.githooks/pre-commit`)이 커밋마다 자동 실행하며, 실패하면 커밋이 막힌다
- hook은 `npm install` 시 `prepare` 스크립트가 `git config core.hooksPath .githooks`로 연결한다. 한 번만 건너뛰려면 `git commit --no-verify`
- `npm run storybook`: 토큰 문서 개발 서버 (http://localhost:6006). `@pts/css`를 먼저 빌드한다
- `npm run build-storybook`: 정적 문서 빌드 (`packages/storybook/dist`)
- `npm run build`: 모든 workspace 빌드 (`@pts/css` → `packages/css/dist/tokens.css`)
  - light 값은 `:root`, dark 값은 `@media (prefers-color-scheme: dark)`와 `[data-theme="dark"]`에 출력. `data-theme="light"`로 라이트를 강제할 수 있다
  - dark 블록에 넣을 그룹은 `terrazzo.config.ts`가 resolver의 dark context 파일에서 자동으로 읽는다

## Token 규칙

- **계층**: primitive → semantic. semantic은 primitive만 참조한다. 예외: 합성 토큰(`text/*`)은 같은 semantic의 속성 토큰을 참조한다. `z-index`는 쌓임 순서 자체가 의미라서 primitive 없이 값을 직접 둔다. component 계층은 필요할 때 추가한다.
- **그룹 이름**: primitive와 semantic의 최상위 그룹 이름은 겹치지 않게 한다 (Terrazzo가 모든 파일을 한 네임스페이스로 합침). 예: primitive `weight` ↔ semantic `font-weight`
- **파일**: primitive와 semantic 모두 카테고리별로 `primitive/<category>.tokens.json`, `semantic/<category>.tokens.json`에 나눈다. 새 파일은 `pts.resolver.json`에 등록한다.
- **포맷**: 모든 토큰에 `$type`을 명시한다. 그룹 단위 `$type` 상속은 쓰지 않는다.
- **dimension**: 단위는 `px`, 객체 형태로 쓴다. `{ "value": 16, "unit": "px" }`
- **color**: DTCG 2025.10 객체 형태. `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }` (components는 0–1)
- **모드**: DTCG resolver의 `theme` modifier(light | dark, 기본 light)로 표현한다. `$extensions.mode`는 쓰지 않는다
- **alias**: 파일과 상관없이 최상위 그룹부터 참조한다. `"{dimension.16}"`
- **네이밍**: kebab-case.
  - primitive `dimension/N`: N은 px 값. 예외로 `dimension/max` = 9999px
  - primitive `typeface/<font-name>`: 폰트 스택 배열 (fallback 포함)
  - primitive `weight/N`: font-weight 숫자 값 (400, 500, 600, 700)
  - primitive `ratio/N`: N = 값 × 100 (예: `ratio/150` = 1.5)
  - primitive `palette/<hue>/N`: 숫자가 클수록 어둡다. hue(red, orange, green, blue, purple)는 50–900 10단계, `neutral`은 50–1000 12단계. `palette/white`, `palette/black`
  - primitive `palette/black-alpha/N`: 검정 + 투명도 N% (5–90). 그림자와 scrim 전용. 별도 opacity 토큰은 두지 않는다
  - primitive `duration/N`: N ms. `easing/standard, decelerate, accelerate`: cubicBezier
  - semantic `space/N`: px = N ÷ 25 (예: `space/400` = 16px). 범위 `space/0 – 800`(0–32px), 컴포넌트 내부 간격용
  - semantic `layout/N`: 100 단위 **단계 번호**(px와 무관), 40px 이상 큰 간격. 100=40, 200=48, 300=64. 사이값은 150처럼 끼워 넣는다
  - semantic `radius`: **티셔츠 사이즈**. none=0, xs=2, sm=4, md=8, lg=12, xl=16, `full`=max
  - semantic `stroke`: **굵기 이름**. thin=1, thick=2, thicker=4. 0 값 토큰은 두지 않는다 (테두리 없음은 border 제거로 표현)
  - semantic `font-family`: sans, serif, mono (IBM Plex)
  - semantic `font-weight`: regular, medium, semibold, bold
  - semantic `font-size/N`: 100 단위 **단계 번호**, 400=16px(본문 기본). 100=10 … 1000=48
  - semantic `line-height`: **배수(unitless)**. tight=1.2, normal=1.5, loose=1.75
  - semantic `letter-spacing`: normal=0
  - semantic `size/icon/sm, md, lg` = 16, 20, 24. `size/control/sm, md, lg` = 32, 40, 48 (버튼·입력창 등 컨트롤 높이 공유)
  - semantic `breakpoint/sm, md, lg, xl` = 640, 768, 1024, 1280 (min-width 기준). CSS 변수는 미디어쿼리 안에서 쓸 수 없어 참고값으로 출력된다
  - semantic `motion/duration/fast, normal, slow` = 100, 200, 300ms. `motion/easing/standard, enter, exit`
  - semantic `z-index/base, dropdown, sticky, overlay, modal, popover, toast, tooltip` = 0, 1000, 1100, 1300 … 1700
  - semantic `shadow/sm, md, lg, xl`: **티셔츠 사이즈**, theme별 값 (dark는 투명도를 높임)
  - semantic `focus-ring/width`, `focus-ring/offset`: 포커스 링 두께와 간격 (둘 다 2px). 색은 `color/border/focus`
  - semantic `color/<속성>/<역할>[-<강도>][-<상태>]`: 속성 background, foreground, border → 역할 → 강도 → 상태
    - 페이지 배경: `background/default`, `default-hover`, `default-pressed`, `subtle`. 투명 요소(목록 항목 등)의 hover/pressed는 `default-hover`, `default-pressed`
    - 중립: `background/inverse`, `background/overlay`(모달 뒤 scrim), `foreground/default, muted, on-inverse`, `border/default, strong, focus`
    - primary: **모노크롬**(neutral). `background/primary[-hover|-pressed]`, `foreground/on-primary`
    - 상태 역할: danger(red), warning(orange), success(green), info(blue), recommend(purple). 각각 `background/<role>[-hover|-pressed]`, `background/<role>-subtle`, `foreground/<role>`, `foreground/on-<role>`, `foreground/on-<role>-subtle`, `border/<role>`
    - disabled: `background/disabled`, `foreground/disabled`, `border/disabled`
    - **상태 방향**: hover → pressed로 갈수록 light는 어두워지고 dark는 밝아진다
    - **짝 규칙**: `foreground/on-X`는 `background/X`와 그 hover/pressed 위에서 쓴다. `on-`이 없는 foreground와 border는 페이지 배경 위에서 쓴다
  - **접근성 (두 테마 모두 필수)**:
    - 글자(foreground): 짝이 되는 모든 배경 대비 4.5:1 이상 (WCAG 1.4.3)
    - UI 경계(`border/*`, solid `background/*`와 그 상태): 페이지 배경 대비 3:1 이상 (WCAG 1.4.11). 포커스 링도 여기에 포함
    - 예외: `border/default`(장식용 구분선), `*/disabled`(비활성 요소), `background/overlay`(반투명 scrim)
    - 반투명 색은 대비를 계산할 수 없으므로 검사 대상 쌍에 들어오면 `npm run check`가 오류를 낸다
    - 검사할 쌍은 `npm run check`가 이 이름 규칙에서 자동으로 만든다. 새 color 토큰도 이 규칙을 따라야 검사 대상이 된다
  - semantic `text/<role>-<size>`: `$type: typography` 합성 토큰. 역할 display, heading, body, label, caption, code × 크기 lg, md, sm. 5개 속성(fontFamily, fontSize, fontWeight, letterSpacing, lineHeight)을 모두 채운다

## 토큰 문서 (Storybook)

- 문서는 토큰 JSON에서 자동으로 만들어진다. 새 토큰은 기존 그룹에 속하면 코드 수정 없이 표에 나타난다
- 새 **그룹**을 추가하면 해당 `.mdx` 페이지에 블록을 추가한다 (예: `<TokenTable prefix="새그룹" />`)
- theme별 값이 다른 그룹은 light / dark 열을 나란히 보여준다. `ThemeCell`은 `data-theme`을 붙여 칸 안의 CSS 변수를 해당 테마 값으로 바꾼다
- 대비 표시는 `npm run check`와 같은 짝 규칙(`on-X` ↔ `background/X`)을 쓴다

토큰 구조를 바꾸는 결정은 ADR로 남긴다 (`docs/adr/NNNN-kebab-case-title.md`).

## 보류 중

- Figma 동기화 방식
- CSS 외 플랫폼 출력

## Git Convention

- **main**: 안정된 상태
- **feature/xxx**: 작업 브랜치
- 릴리스: 태그 기반 (`v1.0.0`)
