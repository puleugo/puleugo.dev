# 이력서 (puleugo.dev/resume)

두 개의 단일 HTML 파일입니다. 외부 요청 없이 열립니다.

| 파일 | 무엇 | 분량 |
|---|---|---|
| `index.html` | 이력서. 사실과 수치만, ⌘P 로 A4 인쇄 | 현재 1페이지 · 2페이지 초과는 테스트가 막는다 |
| `portfolio.html` | 포트폴리오. 사례의 문제·원인·측정·해결·평가 전문 | 제한 없음 |

스타일과 스크립트는 두 파일에 그대로 복사돼 있습니다. **한쪽만 고치면 `npm test` 가 깨집니다** — 양쪽에 같이 반영하세요.
사례를 늘릴 때는 `portfolio.html` 에 쓰고, 이력서에는 결과 한 줄만 남깁니다.

```bash
npm install          # 최초 1회 (@playwright/test)
npm run content      # content/projects.md → index.html 의 프로젝트 섹션 다시 만들기
npm run editor       # 편집기 열기 — 왼쪽 마크다운, 오른쪽 실시간 미리보기
npm test             # 인쇄 2페이지·가로 넘침·각주 호버·OG 규격 검수
npm run og           # 이력서 2페이지를 축소해 og.png(1200×630) 재생성
npm run check        # 검수 + OG 재생성
```

- `npm test` 는 **A4 2페이지를 넘으면 실패**합니다. 지금은 1페이지에 들어가 있어 여유가 한 장 있습니다.
- `npm run editor` 는 마크다운을 고치는 즉시 오른쪽 이력서가 바뀝니다. **저장 · 검사** 를 누르면
  파일에 쓰고 실제로 인쇄해 A4 분량을 재서 알려 줍니다. **수정 프롬프트 복사** 는 지금 내용을 Claude Code 에
  그대로 붙여 넣을 수 있는 지시문으로 만들어 줍니다.
- **프로젝트 섹션은 `content/projects.md` 가 원본입니다.** 거기서 고치고 `npm run content` 를 돌리세요.
  index.html 의 `<!-- projects:start -->` ~ `<!-- projects:end -->` 사이는 손으로 고쳐도 다음 실행 때 덮어써집니다.
- 내용을 고친 뒤에는 `npm run og` 로 링크 미리보기 이미지를 다시 만들어 함께 커밋하세요.
  `pdftoppm`(poppler)이 필요합니다: `brew install poppler`

## 섹션 이름 (요청 시 이 이름으로 불러 주세요)

| 이름 | 위치 / 의도 |
|---|---|
| `.doc-title` | 맨 위 검은 표지 밴드 (문서 이름 + 이름·직무) |
| `.sec` / `.lbl` / `.val` | 좌측 라벨(국문·영문) + 우측 내용, 이력서 골격 |
| `.sec.cont` | 이어지는 행. 라벨 열에는 세부 경력(제품·영역)과 기간이 들어간다 |
| `.duty` | 업무 한 줄. 줄은 보통 굵기, 안쪽 수치만 `<b>` |
| `.entry.brief` | 학력처럼 제목만 있는 항목 (회사보다 한 급 작게) |
| `.intro` | 한 문장 소개 |
| `.hook-stats` | 첫 시선을 잡는 핵심 수치 (MAU·만족도 등) |
| `.contact` | 연락처 줄 |
| `.entry` / `.entry-head` / `.period` | 경력·학력 한 건과 제목줄, 기간 |
| `.facts` | 회사 아래 역할·규모 한 줄 |
| `.work` | 작업 묶음 (소제목 + 항목들) |
| `.task` | 제목이 붙은 작업 항목 |
| `.case-study` | 문제·원인·측정·해결·평가 사례 |
| `.data-table` | 제품·수상·기술 표 |
| `.footnote` / `.references` | 본문 위첨자와 하단 참고 목록 |
| `#preview` | 좌측 링크 미리보기 패널 (`.device-btn` PC/모바일 전환) |
| `#link-card` | 블로그·영상 호버 카드 |
| `#term-toggle-input` | 도메인 용어 토글 |
| `#resume` | 이력서 본문 전체 |
