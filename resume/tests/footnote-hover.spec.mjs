import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RESUME = "file://" + path.resolve(fileURLToPath(import.meta.url), "../../index.html");

test.beforeEach(async ({ page }) => {
	await page.goto(RESUME);
});

// 회귀 방지: sup.fn a::after(닫는 대괄호)와 [data-tip]:hover::after(툴팁)가 같은 의사요소를
// 다투면, 각주에 호버하는 순간 "]" 가 사라지거나 툴팁으로 바뀌어 본문 표기가 깨졌다.
test("각주에 호버해도 대괄호 표기가 유지된다", async ({ page }) => {
	const fn = page.locator("sup.fn").first();
	const bracketAfter = (state) =>
		fn.evaluate((el) => getComputedStyle(el, "::after").content);

	expect(await bracketAfter()).toContain("]");
	await fn.locator("a").hover();
	await page.waitForSelector("#card.on");
	expect(await bracketAfter()).toContain("]"); // 호버 중에도 닫는 괄호가 남아야 한다
});

test("각주 호버가 본문 레이아웃을 바꾸지 않는다", async ({ page }) => {
	// 호버는 요소를 화면 안으로 스크롤시키므로, 스크롤과 무관한 문서 기준 좌표로 비교한다.
	const box = async () =>
		page.evaluate(() => {
			const r = document.getElementById("doc").getBoundingClientRect();
			return JSON.stringify({
				x: Math.round(r.x + window.scrollX),
				y: Math.round(r.y + window.scrollY),
				w: Math.round(r.width),
				h: Math.round(r.height),
			});
		});
	const before = await box();

	for (const i of [0, 2, 5]) {
		const link = page.locator("sup.fn a").nth(i);
		if (!(await link.count())) continue;
		await link.hover();
		await page.waitForTimeout(150);
		expect(await box()).toBe(before);
		await page.mouse.move(0, 0);
	}
	expect(await box()).toBe(before);
});

test("블로그 각주는 호버 시 미리보기 카드를 띄운다", async ({ page }) => {
	await page.locator('sup.fn a[data-card]').first().hover();
	const card = page.locator("#card.on");
	await expect(card).toBeVisible();
	await expect(card.locator(".kind")).toHaveText(/블로그|유튜브/);
	await expect(card.locator("img.thumb")).toHaveAttribute("src", /^data:image/); // 인라인 썸네일이라 네트워크 요청이 없다
});

test("인쇄 시 각주 툴팁과 카드는 숨는다", async ({ page }) => {
	await page.emulateMedia({ media: "print" });
	await expect(page.locator("#card")).toBeHidden();
	await expect(page.locator(".jargon-switch")).toBeHidden();
});
