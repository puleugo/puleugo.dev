# 이력서 (puleugo.dev/resume)

단일 HTML 파일입니다. 외부 요청 없이 열리고, ⌘P 로 A4 2페이지 인쇄됩니다.

```bash
npm install          # 최초 1회 (@playwright/test)
npm test             # 인쇄 2페이지·가로 넘침·각주 호버·OG 규격 검수
npm run og           # 이력서 2페이지를 축소해 og.png(1200×630) 재생성
npm run check        # 검수 + OG 재생성
```

- `npm test` 는 **A4 2페이지를 넘으면 실패**합니다. 내용을 늘렸다면 여기서 먼저 걸립니다.
- 내용을 고친 뒤에는 `npm run og` 로 링크 미리보기 이미지를 다시 만들어 함께 커밋하세요.
  `pdftoppm`(poppler)이 필요합니다: `brew install poppler`

## 섹션 이름 (요청 시 이 이름으로 불러 주세요)

| 이름 | 위치 / 의도 |
|---|---|
| `.headline` | 이름 아래 압축 키워드 세 개 |
| `.intro` | 한 문장 소개 |
| `.hook-stats` | 첫 시선을 잡는 핵심 수치 (MAU·만족도 등) |
| `.highlights` | 요약 항목 |
| `.contact` | 연락처 줄 |
| `.entry` / `.entry-head` / `.period` | 경력·학력 한 건과 제목줄, 기간 |
| `.facts` | 회사 아래 역할·규모 한 줄 |
| `.work` | 작업 묶음 (소제목 + 항목들) |
| `.task` | 제목이 붙은 작업 항목 |
| `.case-study` | 문제·원인·측정·해결·평가 사례 |
| `.data-table` | 제품·수상·기술 표 |
| `.tag` | [긴급] 같은 라벨 |
| `.footnote` / `.references` | 본문 위첨자와 하단 참고 목록 |
| `#preview` | 좌측 링크 미리보기 패널 (`.device-btn` PC/모바일 전환) |
| `#link-card` | 블로그·영상 호버 카드 |
| `#term-toggle-input` | 도메인 용어 토글 |
| `#resume` | 이력서 본문 전체 |
