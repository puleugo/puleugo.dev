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
<div id="og" style="width:1200px;height:630px;background:#f2f3f5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;
	font-family:'Pretendard',-apple-system,'Apple SD Gothic Neo',sans-serif;color:#16181d">
	<div style="display:flex;align-items:baseline;gap:12px">
		<span style="font-size:34px;font-weight:800;letter-spacing:-.02em">임채성</span>
		<span style="font-size:19px;font-weight:600;color:#52565f">프로덕트 엔지니어 (풀스택)</span>
	</div>
	<div style="display:flex;gap:22px">
		${shots.map((src) => `<img src="${src}" style="height:400px;background:#fff;border:1px solid #dcdfe4;box-shadow:0 10px 26px rgba(0,0,0,.10)">`).join("")}
	</div>
	<div style="font-size:16px;color:#52565f;letter-spacing:.01em">puleugo.dev/resume · A4 2페이지</div>
</div></body>`);
await page.locator("#og").screenshot({ path: path.join(ROOT, "og.png") });
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log("og.png 생성 완료 (이력서 " + pageCount + "페이지 기준)");
