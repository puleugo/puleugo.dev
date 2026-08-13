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
