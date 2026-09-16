import { test, expect } from "@playwright/test";
import { render, parse } from "../scripts/projects-md.mjs";

// 주석 처리한 줄은 이력서에 나오면 안 된다. 여러 줄 주석 안의 "- " 줄도 마찬가지.
test("주석 처리한 줄은 프로젝트 섹션에서 빠진다", () => {
	const md = ["## 시험", "- 기간: 2026.1. - 현재", "- 보이는 줄", "<!-- - 한 줄 주석 -->", "<!--", "- 여러 줄 주석 안", "- 규모: 숨긴 규모", "-->", "- 끝 줄 <!-- 줄 끝 주석 -->"].join("\n");
	const [p] = parse(md);
	expect(p.duties.map((d) => d.text.trim())).toEqual(["보이는 줄", "끝 줄"]);
	expect(p.fields.규모).toBeUndefined();
	const html = render(md);
	expect(html).not.toContain("주석");
	expect(html).not.toContain("숨긴 규모");
});

test("마크다운 표기가 이력서 마크업으로 바뀐다", () => {
	const html = render("## 시험\n- 수치 **51%** · {쉬운 말|업계 용어} · [글](https://github.com/x/y)");
	expect(html).toContain("<b>51%</b>");
	expect(html).toContain('<t data-x="업계 용어">쉬운 말</t>');
	expect(html).toContain('href="https://github.com/x/y" target="_blank" rel="noopener"');
});
