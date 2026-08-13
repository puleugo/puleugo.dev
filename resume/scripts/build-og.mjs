// 이력서 2페이지를 그대로 축소해 링크 미리보기(OpenGraph) 이미지를 만든다.
// 실행: npm run og   (결과: resume/og.png, 1200×630)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "resume-og-"));
const pdf = path.join(tmp, "resume.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + path.join(ROOT, "index.html"));
await page.emulateMedia({ media: "print" });
await page.pdf({ path: pdf, format: "A4", printBackground: true, margin: { top: "12mm", bottom: "12mm", left: "13mm", right: "13mm" } });

const pageCount = (fs.readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
if (pageCount !== 2) throw new Error(`이력서가 ${pageCount}페이지입니다. OG 이미지는 2페이지 기준으로만 만듭니다.`);

execFileSync("pdftoppm", ["-png", "-r", "160", pdf, path.join(tmp, "p")]);
const shots = fs.readdirSync(tmp).filter((f) => f.startsWith("p-")).sort()
	.map((f) => "data:image/png;base64," + fs.readFileSync(path.join(tmp, f)).toString("base64"));

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0">
<div id="og" style="position:relative;width:1200px;height:630px;overflow:hidden;background:#edeff2;
	font-family:'Pretendard',-apple-system,'Apple SD Gothic Neo',sans-serif;color:#16181d">
	<div style="position:absolute;left:54px;top:46px;display:flex;gap:26px">
		${shots.map((src) => `<img src="${src}" style="width:440px;background:#fff;border:1px solid #d5d9df;box-shadow:0 18px 40px rgba(16,20,28,.16)">`).join("")}
	</div>
	<div style="position:absolute;right:0;bottom:0;width:560px;height:300px;background:radial-gradient(120% 120% at 100% 100%,
		#dfe3e9 12%, rgba(226,229,235,.92) 34%, rgba(233,236,240,.55) 58%, rgba(237,239,242,0) 78%)"></div>
	<div style="position:absolute;right:52px;bottom:46px;text-align:right;line-height:1.2">
		<div style="font-size:40px;font-weight:800;letter-spacing:-.03em">임채성 이력서</div>
		<div style="font-size:20px;font-weight:600;color:#3f434b;margin-top:6px">프로덕트 엔지니어 (풀스택)</div>
		<div style="font-size:16px;color:#6a6f78;margin-top:12px">puleugo.dev/resume · A4 2페이지</div>
	</div>
</div></body>`);
await page.locator("#og").screenshot({ path: path.join(ROOT, "og.png") });
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log("og.png 생성 완료 (이력서 " + pageCount + "페이지 기준)");
