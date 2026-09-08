import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(fileURLToPath(import.meta.url), "../..");
const read = (f) => fs.readFileSync(path.join(dir, f), "utf-8");
const block = (html, tag) => {
	const m = html.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
	return m ? m[1] : null;
};

// 이력서와 포트폴리오는 같은 스타일·스크립트를 복사해서 쓴다.
// 한쪽만 고치면 두 문서가 조용히 어긋나므로 여기서 막는다.
test("두 문서의 스타일·스크립트 블록은 동일하다", () => {
	const a = read("index.html");
	const b = read("portfolio.html");
	for (const tag of ["style", "script"]) {
		expect(block(a, tag)).not.toBeNull();
		expect(block(b, tag)).toBe(block(a, tag));
	}
});

// 두 문서는 서로를 가리켜야 한다. 한쪽만 배포되면 상세 사례로 가는 길이 끊긴다.
test("이력서와 포트폴리오는 서로 링크한다", () => {
	expect(read("index.html")).toContain('href="./portfolio.html"');
	expect(read("portfolio.html")).toContain('<a href="./" data-private>');
});

// 사례 전문(문제·원인·해결 목록)은 포트폴리오에만 둔다. 이력서로 되돌아오면 2페이지 규격이 깨진다.
test("사례 전문은 포트폴리오에만 있다", () => {
	expect(read("portfolio.html").match(/<dt>/g).length).toBeGreaterThan(10);
	expect(read("index.html")).not.toContain("<dt>");
});
