// 이력서 안의 모든 외부 링크에 대해 OG 메타(제목·설명·썸네일)를 수집해 HTML 에 인라인한다.
// 실행: npm run cards   (결과: index.html 의 CARDS 데이터 갱신)
// 런타임 네트워크 요청을 없애려고 썸네일은 240px JPEG 로 줄여 data: URI 로 넣는다.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const FILE = path.join(ROOT, "index.html");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const KIND = [
	[/youtube\.com|youtu\.be/, "유튜브 영상"],
	[/github\.com\/.*\/pull\//, "깃허브 PR"],
	[/github\.com/, "깃허브 저장소"],
	[/cafe\.naver\.com/, "네이버 카페 글"],
	[/namu\.wiki/, "나무위키 문서"],
	[/docs\./, "공식 문서"],
	[/ko\.puleugo\.dev\/\d+/, "블로그 글"],
	[/news|veritas-a|newsgn|nate/, "기사"],
];
const kindOf = (url) => (KIND.find(([re]) => re.test(url)) || [null, "사이트"])[1];

const html = fs.readFileSync(FILE, "utf8");
const urls = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))]
	.filter((u) => !u.includes("puleugo.dev/resume"));

const meta = async (url) => {
	const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
	const buf = Buffer.from(await res.arrayBuffer());
	// EUC-KR 등 비 UTF-8 문서(네이버 카페 등)를 위해 charset 을 보고 디코딩한다
	const head = buf.subarray(0, 4096).toString("latin1");
	const cs = (res.headers.get("content-type") || "").match(/charset=([\w-]+)/i)?.[1]
		|| head.match(/charset=["']?([\w-]+)/i)?.[1] || "utf-8";
	const body = new TextDecoder(cs.toLowerCase().replace("ms949", "euc-kr")).decode(buf);
	const pick = (p) =>
		(body.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]*content=["']([^"']*)`, "i")) ||
			body.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${p}["']`, "i")) || [])[1];
	const title = pick("og:title") || (body.match(/<title>([^<]*)/i) || [])[1] || new URL(url).host;
	const desc = pick("og:description") || pick("description") || "";
	return { title: decode(title).trim(), desc: decode(desc).trim(), image: pick("og:image") };
};
const decode = (t = "") => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const thumb = async (imgUrl, tmp, i) => {
	if (!imgUrl) return null;
	try {
		const r = await fetch(imgUrl, { headers: { "User-Agent": UA, Referer: "https://puleugo.dev/" } });
		if (!r.ok) return null;
		const raw = path.join(tmp, `raw-${i}`);
		fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
		const out = path.join(tmp, `t-${i}.jpg`);
		execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "50", "-Z", "240", raw, "--out", out], { stdio: "ignore" });
		return "data:image/jpeg;base64," + fs.readFileSync(out).toString("base64");
	} catch { return null; }
};

const tmp = fs.mkdtempSync("/tmp/resume-cards-");
const cards = {};
for (const [i, url] of urls.entries()) {
	try {
		const m = await meta(url);
		cards[url] = { kind: kindOf(url), title: m.title.slice(0, 70), desc: m.desc.replace(/\s+/g, " ").slice(0, 96),
			src: new URL(url).host + new URL(url).pathname.slice(0, 28), img: await thumb(m.image, tmp, i) };
		console.log(`✓ ${cards[url].kind.padEnd(8)} ${url.slice(0, 60)}${cards[url].img ? " (썸네일)" : ""}`);
	} catch (e) { console.log(`✗ ${url.slice(0, 60)} — ${e.message.slice(0, 40)}`); }
}
fs.rmSync(tmp, { recursive: true, force: true });

// 링크마다 data-card="URL" 을 달고, CARDS 데이터를 교체한다.
let out = html.replace(/<a ([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/g, (full, pre, url, post) => {
	if (!cards[url]) return full;
	const clean = (t) => t.replace(/\s+data-card="[^"]*"/g, "");
	return `<a ${clean(pre)}href="${url}"${clean(post)} data-card="${url}">`;
});
out = out.replace(/const CARDS = \{[\s\S]*?\};\n/, `const CARDS = ${JSON.stringify(cards)};\n`);
fs.writeFileSync(FILE, out);
console.log(`\n카드 ${Object.keys(cards).length}개 (썸네일 ${Object.values(cards).filter((c) => c.img).length}개) · index.html ${(out.length / 1024).toFixed(0)}KB`);
