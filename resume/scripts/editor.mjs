#!/usr/bin/env node
// 편집기용 작은 서버. file:// 로는 fetch·ESM import 가 막혀서 정적 서버가 필요하다.
// 저장하면 projects.md 를 쓰고 index.html 을 다시 만든 뒤, 실제로 인쇄해 A4 분량을 잰다.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const dir = path.resolve(fileURLToPath(import.meta.url), "../..");
const MD = path.join(dir, "content/projects.md");
const TYPES = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".md": "text/markdown; charset=utf-8" };

async function measure() {
	const { chromium } = await import("playwright");
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await page.setViewportSize({ width: 703, height: 1039 });
	await page.goto("file://" + path.join(dir, "index.html"));
	await page.emulateMedia({ media: "print" });
	const height = await page.evaluate(() => Math.round(document.getElementById("resume").getBoundingClientRect().height));
	const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "11mm", bottom: "11mm", left: "12mm", right: "12mm" } });
	await browser.close();
	return { height, pages: (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length };
}

const server = http.createServer(async (req, res) => {
	try {
		if (req.url.startsWith("/api/md") && req.method === "GET") {
			const [md, st] = [await fs.readFile(MD, "utf-8"), await fs.stat(MD)];
			return res.writeHead(200, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify({ md, mtime: st.mtimeMs }));
		}
		if (req.url.startsWith("/api/md") && req.method === "POST") {
			const chunks = []; for await (const c of req) chunks.push(c);
			const { md, base, measure: wantMeasure } = JSON.parse(Buffer.concat(chunks).toString());
			// 편집기 밖에서 파일이 바뀌었으면 덮어쓰지 않는다(자동저장이 남의 수정을 먹는 사고 방지)
			const before = await fs.stat(MD);
			if (base && Math.abs(before.mtimeMs - base) > 1) {
				return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, conflict: true, md: await fs.readFile(MD, "utf-8"), mtime: before.mtimeMs }));
			}
			await fs.writeFile(MD, md);
			await promisify(execFile)(process.execPath, [path.join(dir, "scripts/build-projects.mjs")]);
			const after = await fs.stat(MD);
			// 분량 측정은 크로미움을 띄운다. 자동저장 때마다 돌리면 메모리를 크게 쓰므로 요청할 때만.
			return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true, mtime: after.mtimeMs, ...(wantMeasure ? await measure() : {}) }));
		}
		const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\//, "") || "editor.html";
		const file = path.join(dir, rel);
		if (!file.startsWith(dir)) return res.writeHead(403).end();
		const body = await fs.readFile(file);   // 헤더보다 먼저 읽는다. 읽기가 실패한 뒤 헤더를 쓰면 catch 에서 다시 쓸 수 없다
		res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
	} catch (e) {
		if (res.headersSent) return res.end();
		res.writeHead(req.url.startsWith("/api/") ? 200 : 404, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: String(e.message || e) }));
	}
});
const port = Number(process.env.PORT) || 4173;
server.listen(port, () => {
	const url = `http://localhost:${port}/editor.html`;
	console.log(`편집기: ${url}  (Ctrl+C 로 종료)`);
	execFile("open", [url], () => {});
});
