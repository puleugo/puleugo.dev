#!/usr/bin/env node
// content/projects.md → index.html 의 "프로젝트" 섹션.
// 이력서 본문에서 가장 자주 고치는 부분만 마크다운으로 뺐다. 나머지(기본정보·수상·기술)는 HTML 그대로 둔다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(fileURLToPath(import.meta.url), "../..");
const md = fs.readFileSync(path.join(dir, "content/projects.md"), "utf-8");

const esc = (s) => s.replace(/&(?![a-z]+;|#\d+;)/g, "&amp;");
const icon = (id) => `<svg class="icon"><use href="#i-${id}"/></svg>`;

// 링크 모양은 도메인이 정한다. 말풍선 문구는 마크다운 제목( "…" )이 있으면 그것을 쓴다.
const SITES = { "www.auruda-j.com": "어르다", "verbatim.auruda-j.com": "어르다 축어록", "genogram.auruda-j.com": "어르다 가계도" };
function link(text, url, tip) {
	const host = new URL(url).host;
	const attr = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`)).join("");
	if (SITES[host]) return `<a href="${url}"${attr({ "data-preview": true, "data-tip": tip ?? `사이트 미리보기 · ${SITES[host]} (${host})`, "data-card": url })}>${icon("site-b")}${text}</a>`;
	if (host === "namu.wiki") return `<a class="wiki-link" href="${url}"${attr({ target: "_blank", rel: "noopener", "data-tip": tip, "data-card": url })}>${icon("namu-b")}${text}</a>`;
	if (host.endsWith("youtube.com")) return `<a href="${url}"${attr({ "data-preview": url.replace("watch?v=", "embed/").replace("www.youtube.com", "www.youtube.com"), "data-tip": tip, "data-card": url })}>${icon("youtube")}${text}</a>`;
	if (host === "github.com") return `<a href="${url}"${attr({ target: "_blank", rel: "noopener", "data-tip": tip, "data-card": url })}>${icon("github")}${text}</a>`;
	const preview = host.startsWith("docs.");
	return `<a href="${url}"${attr({ "data-preview": preview || undefined, target: preview ? undefined : "_blank", rel: preview ? undefined : "noopener", "data-tip": tip, "data-card": url })}>${icon("doc-b")}${text}</a>`;
}

function inline(s) {
	return esc(s)
		.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, t, u, tip) => link(inline(t), u, tip))
		.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, (_, easy, term) => `<t data-x="${term}">${easy}</t>`)
		.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

const projects = [];
for (const line of md.split("\n")) {
	if (line.startsWith("## ")) projects.push({ name: line.slice(3).trim(), fields: {}, duties: [] });
	else if (line.startsWith("- ") && projects.length) {
		const body = line.slice(2);
		const m = body.match(/^(기간|기여율|역할|소개|규모|링크없음):\s*(.*)$/);
		const p = projects.at(-1);
		if (m) p.fields[m[1]] = m[2];
		else p.duties.push(body.startsWith("사례:") ? { kind: "case-study", text: body.slice(3).trim() } : { kind: "task", text: body });
	}
}

const html = projects.map((p) => {
	const f = p.fields;
	const title = f.링크없음 ? `<span class="closed" data-tip="${f.링크없음}">${p.name}</span>` : p.name;
	const lbl = [`<h4>${title}</h4>`, f.기간 && `<span class="period">${f.기간}</span>`, f.기여율 && `<span class="rate">${inline(f.기여율)}</span>`, f.역할 && `<span class="role">${inline(f.역할)}</span>`].filter(Boolean).join("");
	const facts = [f.소개 && `\t\t<p class="facts">${inline(f.소개)}</p>`, f.규모 && `\t\t<p class="facts"><b>규모</b> ${inline(f.규모)}</p>`].filter(Boolean).join("\n");
	const duties = p.duties.map((d) => `\t\t\t<li class="${d.kind}"><span class="duty">${inline(d.text)}</span></li>`).join("\n");
	return `<section class="sec cont">\n\t<div class="lbl">${lbl}</div>\n${facts}\n\t\t<ul>\n${duties}\n\t\t</ul>\n</section>`;
}).join("\n\n");

const file = path.join(dir, "index.html");
const src = fs.readFileSync(file, "utf-8");
const S = "<!-- projects:start -->", E = "<!-- projects:end -->";
if (!src.includes(S)) throw new Error(`index.html 에 ${S} / ${E} 표시가 없다`);
const out = src.slice(0, src.indexOf(S) + S.length) + "\n" + html + "\n" + src.slice(src.indexOf(E));
fs.writeFileSync(file, out);
console.log(`프로젝트 ${projects.length}건 반영: ${projects.map((p) => p.name).join(" · ")}`);
