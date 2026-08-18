import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RESUME = "file://" + path.resolve(fileURLToPath(import.meta.url), "../../index.html");
export const A4 = { format: "A4", printBackground: true, margin: { top: "12mm", bottom: "12mm", left: "13mm", right: "13mm" } };

export function pdfPageCount(buf) {
	return (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
}

// 이력서는 제출 규격상 A4 2페이지를 넘지 않아야 한다. 내용이 늘어나면 여기서 먼저 깨진다.
test("인쇄하면 A4 2페이지 이내다", async ({ page }) => {
	await page.goto(RESUME);
	await page.emulateMedia({ media: "print" });
	const out = path.join(os.tmpdir(), `resume-${Date.now()}.pdf`);
	await page.pdf({ path: out, ...A4 });
	const pages = pdfPageCount(fs.readFileSync(out));
	fs.unlinkSync(out);
	expect(pages).toBeGreaterThan(0);
	expect(pages).toBeLessThanOrEqual(2);
});

// 인쇄 폭에서 가로로 넘치면 잘려 나간다.
test("인쇄 폭에서 가로 넘침이 없다", async ({ page }) => {
	await page.setViewportSize({ width: 794, height: 1123 });
	await page.goto(RESUME);
	await page.emulateMedia({ media: "print" });
	const overflow = await page.evaluate(() => {
		const doc = document.documentElement;
		const wide = [...document.querySelectorAll("#resume *")].filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1);
		return wide.slice(0, 3).map((el) => el.tagName + "." + (el.className || ""));
	});
	expect(overflow).toEqual([]);
});

// 링크 공유 미리보기: OG 이미지가 실제로 존재하고 규격(1200×630)을 지키는지 확인한다.
test("OG 이미지가 1200×630 규격으로 존재한다", async ({ page }) => {
	const og = path.resolve(fileURLToPath(import.meta.url), "../../og.png");
	expect(fs.existsSync(og)).toBe(true);
	const size = await page.evaluate(
		(src) => new Promise((r) => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = src; }),
		"data:image/png;base64," + fs.readFileSync(og).toString("base64"),
	);
	expect(size).toEqual([1200, 630]);
	await page.goto(RESUME);
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://puleugo.dev/resume/og.png");
});

// 페이지 보기: 두 쪽을 한 화면에 담고, 미리보기 패널이 열려도 문서가 화면 안에 남아야 한다.
test("페이지 보기에서 전체 내용이 한 화면에 들어간다", async ({ page }) => {
	await page.setViewportSize({ width: 1512, height: 950 });
	await page.goto(RESUME);
	await page.check("#paged-input");
	const box = () => page.evaluate(() => {
		const d = document.getElementById("resume").getBoundingClientRect();
		const last = document.querySelector(".references").getBoundingClientRect();
		return { inView: d.right <= innerWidth + 1 && d.bottom <= innerHeight + 1,
			tailInside: last.right <= d.right + 1 && last.bottom <= d.bottom + 1,
			scroll: document.documentElement.scrollHeight > innerHeight + 1 };
	});
	expect(await box()).toEqual({ inView: true, tailInside: true, scroll: false });

	// 패널을 열면 클릭한 링크가 있는 쪽 하나만 크게 보여준다 (clip-path 로 나머지 쪽을 가림)
	await page.locator('a[data-preview]').first().click();
	await page.waitForTimeout(700);
	const withPanel = await page.evaluate(() => {
		const el = document.getElementById("resume");
		const r = el.getBoundingClientRect();
		const p = document.getElementById("preview").getBoundingClientRect();
		const scale = Number((el.style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
		const showsSecond = /inset\(0px 0px 0px 747px\)/.test(el.style.clipPath);
		const visLeft = r.left + (showsSecond ? 747 * scale : 0);
		return { single: el.style.clipPath !== "none" && el.style.clipPath !== "",
			inView: visLeft + 747 * scale <= innerWidth + 1, overlap: p.right > visLeft + 1 };
	});
	expect(withPanel).toEqual({ single: true, inView: true, overlap: false });
});

// 개인정보 가리기는 화면 표시가 아니라 본문 DOM 을 바꾸므로, 인쇄(PDF)에도 그대로 나가야 한다.
test("가린 상태로 인쇄하면 이름·연락처·개인 도메인이 PDF 에 남지 않는다", async ({ page }) => {
	await page.goto(RESUME + "?mask=1");
	await page.emulateMedia({ media: "print" });
	const out = path.join(os.tmpdir(), `resume-masked-${Date.now()}.pdf`);
	await page.pdf({ path: out, ...A4 });
	const buf = fs.readFileSync(out);
	const pages = pdfPageCount(buf);
	// 개인 링크는 주소까지 떼어내므로 PDF 의 링크 주석(/URI)에도 남지 않는다.
	const uris = (buf.toString("latin1").match(/\/URI\s*\(([^)]*)\)/g) || []).join(" ");
	const text = await page.locator("#resume").innerText();
	fs.unlinkSync(out);

	expect(text).not.toContain("임채성");
	expect(text).not.toContain("4057-6373");
	expect(text).not.toContain("puleugo");
	expect(uris).not.toContain("puleugo");
	expect(pages).toBeLessThanOrEqual(2); // 가려도 2페이지 규격은 그대로
});

// 토글을 껐다 켜면 원래 값이 손상 없이 돌아와야 한다.
test("가리기를 해제하면 원래 연락처와 링크가 복구된다", async ({ page }) => {
	await page.goto(RESUME);
	const contact = page.locator(".contact");
	const before = await contact.innerText();
	const href = await page.locator('.contact a[href*="github"]').getAttribute("href");
	await page.check("#mask-input");
	expect(await contact.innerText()).not.toContain("puleugo");
	await page.uncheck("#mask-input");
	expect(await contact.innerText()).toBe(before);
	expect(await page.locator(".contact a[href*='github']").getAttribute("href")).toBe(href);
});

// 수상 표의 시기 칸("2025.11.–12.")은 폭이 좁아 화면에서 두 줄로 쪼개졌다. 인쇄만 보면 놓친다.
test("수상 표의 시기 칸은 화면·인쇄 모두 한 줄로 표기된다", async ({ page }) => {
	await page.goto(RESUME);
	const lines = () => page.evaluate(() =>
		[...document.querySelectorAll("table.awards td:last-child")].map((td) => {
			const r = document.createRange();
			r.selectNodeContents(td);
			return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; // 줄 상자 개수
		}));
	for (const w of [1512, 1100, 768, 390]) {
		await page.setViewportSize({ width: w, height: 900 });
		expect(await lines(), `화면 ${w}px`).toEqual([1, 1, 1]);
	}
	await page.emulateMedia({ media: "print" });
	await page.setViewportSize({ width: 794, height: 1123 });
	expect(await lines(), "인쇄").toEqual([1, 1, 1]);
});
