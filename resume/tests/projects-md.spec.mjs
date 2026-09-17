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

// 들여쓰기로 하위 항목을 만든다. 두 칸(또는 탭)이 한 단계.
test("들여쓴 목록은 하위 목록으로 그려진다", () => {
	const md = ["## 시험", "- 상위", "  - 하위 1", "    - 하위의 하위", "  - 하위 2", "\t- 탭 하위", "- 다음 상위"].join("\n");
	const [p] = parse(md);
	expect(p.duties.map((d) => d.text)).toEqual(["상위", "다음 상위"]);
	expect(p.duties[0].children.map((d) => d.text)).toEqual(["하위 1", "하위 2", "탭 하위"]);
	expect(p.duties[0].children[0].children.map((d) => d.text)).toEqual(["하위의 하위"]);
	const html = render(md);
	expect(html).toContain('<span class="duty">상위</span><ul class="how"><li>하위 1<ul class="how"><li>하위의 하위</li></ul></li><li>하위 2</li><li>탭 하위</li></ul></li>');
	expect(html).toContain('<li class="task"><span class="duty">다음 상위</span></li>');
});
