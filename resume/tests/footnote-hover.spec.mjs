import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RESUME = "file://" + path.resolve(fileURLToPath(import.meta.url), "../../index.html");

test.beforeEach(async ({ page }) => {
	await page.goto(RESUME);
});

test("링크 호버가 본문 레이아웃을 바꾸지 않는다", async ({ page }) => {
	// 호버는 요소를 화면 안으로 스크롤시키므로, 스크롤과 무관한 문서 기준 좌표로 비교한다.
	const box = async () =>
		page.evaluate(() => {
			const r = document.getElementById("resume").getBoundingClientRect();
			return JSON.stringify({
				x: Math.round(r.x + window.scrollX),
				y: Math.round(r.y + window.scrollY),
				w: Math.round(r.width),
				h: Math.round(r.height),
			});
		});
	const before = await box();

	for (const i of [0, 2, 5]) {
		const link = page.locator("#resume a[data-card]").nth(i);
		if (!(await link.count())) continue;
		await link.hover();
		await page.waitForTimeout(150);
		expect(await box()).toBe(before);
		await page.mouse.move(0, 0);
	}
	expect(await box()).toBe(before);
});

test("본문 링크는 호버 시 미리보기 카드를 띄운다", async ({ page }) => {
	await page.locator('#resume a[data-card*="youtube"]').first().hover();
	const card = page.locator("#link-card.on");
	await expect(card).toBeVisible();
	await expect(card.locator(".kind")).toHaveText(/블로그|유튜브|사이트|문서/);
	await expect(card.locator("img.thumb")).toHaveAttribute("src", /^data:image/); // 인라인 썸네일이라 네트워크 요청이 없다
});

test("인쇄 시 툴팁과 카드는 숨는다", async ({ page }) => {
	await page.emulateMedia({ media: "print" });
	await expect(page.locator("#link-card")).toBeHidden();
	await expect(page.locator(".term-toggle")).toBeHidden();
});
