// content/projects.md → 프로젝트 섹션 HTML. 파일을 만지지 않는 순수 변환이라
// CLI(build-projects.mjs)와 브라우저 편집기(editor.html)가 같은 코드를 쓴다.
const esc = (s) => s.replace(/&(?![a-z]+;|#\d+;)/g, "&amp;");
const icon = (id) => `<svg class="icon"><use href="#i-${id}"/></svg>`;
const SITES = { "www.auruda-j.com": "어르다", "verbatim.auruda-j.com": "어르다 축어록", "genogram.auruda-j.com": "어르다 가계도" };
const attr = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== false && v !== null).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`)).join("");

// 링크 모양은 도메인이 정한다. 말풍선은 마크다운 제목( "…" )이 있으면 그것을 쓴다.
function link(text, url, tip) {
	let host = "";
	try { host = new URL(url).host; } catch { return text; }
	if (SITES[host]) return `<a href="${url}"${attr({ "data-preview": true, "data-tip": tip ?? `사이트 미리보기 · ${SITES[host]} (${host})`, "data-card": url })}>${icon("site-b")}${text}</a>`;
	if (host === "namu.wiki") return `<a class="wiki-link" href="${url}"${attr({ target: "_blank", rel: "noopener", "data-tip": tip, "data-card": url })}>${icon("namu-b")}${text}</a>`;
	if (host.endsWith("youtube.com")) return `<a href="${url}"${attr({ "data-preview": url.replace("watch?v=", "embed/"), "data-tip": tip, "data-card": url })}>${icon("youtube")}${text}</a>`;
	if (host === "github.com") return `<a href="${url}"${attr({ target: "_blank", rel: "noopener", "data-tip": tip, "data-card": url })}>${icon("github")}${text}</a>`;
	const preview = host.startsWith("docs.");
	return `<a href="${url}"${attr({ "data-preview": preview || undefined, target: preview ? undefined : "_blank", rel: preview ? undefined : "noopener", "data-tip": tip, "data-card": url })}>${icon("doc-b")}${text}</a>`;
}

export function inline(s) {
	return esc(s)
		.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, t, u, tip) => link(inline(t), u, tip))
		.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, (_, easy, term) => `<t data-x="${term}">${easy}</t>`)
		.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

// <!-- … --> 는 줄 안이든 여러 줄이든 통째로 빠진다. 편집기의 ⌘/ 가 이 표기로 주석을 단다.
export const stripComments = (md) => md.replace(/<!--[\s\S]*?-->/g, "");

export function parse(md) {
	const projects = [];
	for (const line of stripComments(md).split("\n")) {
		if (line.startsWith("## ")) { projects.push({ name: line.slice(3).trim(), fields: {}, duties: [], _stack: null }); continue; }
		const m = line.match(/^([ \t]*)- (.*)$/);
		if (!m || !projects.length) continue;
		const p = projects.at(-1);
		const depth = indentDepth(m[1]);
		const body = m[2].trimEnd();
		const field = depth === 0 && body.match(/^(기간|기여율|역할|소개|규모|링크없음):\s*(.*)$/);
		if (field) { p.fields[field[1]] = field[2]; continue; }
		if (!body.trim()) continue;
		const node = depth === 0 && body.startsWith("사례:") ? { kind: "case-study", text: body.slice(3).trim(), depth, children: [] } : { kind: "task", text: body, depth, children: [] };
		// 들여쓰기 깊이로 부모를 찾는다. 두 칸(또는 탭 하나)이 한 단계.
		const stack = (p._stack ??= [{ depth: -1, children: p.duties }]);
		while (stack.at(-1).depth >= depth) stack.pop();
		stack.at(-1).children.push(node);
		stack.push(node);
	}
	for (const p of projects) delete p._stack;
	return projects;
}

// 탭은 한 단계, 공백은 두 칸이 한 단계.
export const indentDepth = (ws) => [...ws].reduce((n, c) => n + (c === "\t" ? 2 : 1), 0) >> 1;

export function render(md) {
	return parse(md).map((p) => {
		const f = p.fields;
		const title = f.링크없음 ? `<span class="closed" data-tip="${f.링크없음}">${p.name}</span>` : p.name;
		const lbl = [`<h4>${title}</h4>`, f.기간 && `<span class="period">${f.기간}</span>`, f.기여율 && `<span class="rate">${inline(f.기여율)}</span>`, f.역할 && `<span class="role">${inline(f.역할)}</span>`].filter(Boolean).join("");
		const facts = [f.소개 && `\t\t<p class="facts">${inline(f.소개)}</p>`, f.규모 && `\t\t<p class="facts"><b>규모</b> ${inline(f.규모)}</p>`].filter(Boolean).join("\n");
		const sub = (kids) => (kids.length ? `<ul class="how">${kids.map((k) => `<li>${inline(k.text)}${sub(k.children)}</li>`).join("")}</ul>` : "");
		const duties = p.duties.map((d) => `\t\t\t<li class="${d.kind}"><span class="duty">${inline(d.text)}</span>${sub(d.children)}</li>`).join("\n");
		return `<section class="sec cont">\n\t<div class="lbl">${lbl}</div>\n${facts}\n\t\t<ul>\n${duties}\n\t\t</ul>\n</section>`;
	}).join("\n\n");
}

export const MARKERS = ["<!-- projects:start -->", "<!-- projects:end -->"];
