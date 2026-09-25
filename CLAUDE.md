# PTS — Personal Token System

개인 스터디 프로젝트. 디자인 토큰 모노레포를 공부하면서 나만의 토큰 파이프라인을 만든다.

## Tech Stack

- Package Manager: npm (workspaces)
- Token Format: DTCG (W3C Design Token Community Group)
- Language: TypeScript (코드가 생기는 단계에서 도입)

## Structure

```
pts/
├── docs/adr/            # 의사결정 기록 (English)
└── packages/
    └── tokens/          # @pts/tokens — DTCG 소스, SSoT
        └── src/
            ├── primitive.tokens.json   # 원시값
            └── semantic.tokens.json    # 용도별 토큰 (primitive alias)
```

새 패키지는 `packages/<name>`에 `@pts/<name>`으로 추가한다.

## Token 규칙

- **계층**: primitive → semantic. semantic은 primitive만 참조한다. component 계층은 필요할 때 추가한다.
- **포맷**: 모든 토큰에 `$type`을 명시한다. 그룹 단위 `$type` 상속은 쓰지 않는다.
- **dimension**: 단위는 `px`, 객체 형태로 쓴다. `{ "value": 16, "unit": "px" }`
- **alias**: 파일과 상관없이 최상위 그룹부터 참조한다. `"{dimension.16}"`
- **네이밍**: kebab-case.
  - primitive `dimension/N`: N은 px 값. 예외로 `dimension/max` = 9999px
  - semantic `space/N`: 숫자 스케일, px = N ÷ 25 (예: `space/400` = 16px). 범위는 `space/0 – 800`(0–32px), 컴포넌트 내부 간격용. 그보다 큰 간격은 layout 토큰으로 분리 (예정)

토큰 구조를 바꾸는 결정은 ADR로 남긴다 (`docs/adr/NNNN-kebab-case-title.md`).

## 보류 중

- Figma 동기화 방식
- 빌드 도구 (Terrazzo 등)와 플랫폼 출력

## Git Convention

- **main**: 안정된 상태
- **feature/xxx**: 작업 브랜치
- 릴리스: 태그 기반 (`v1.0.0`)
