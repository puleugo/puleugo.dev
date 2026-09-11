#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, parse, MARKERS } from "./projects-md.mjs";

const dir = path.resolve(fileURLToPath(import.meta.url), "../..");
const md = fs.readFileSync(path.join(dir, "content/projects.md"), "utf-8");
const file = path.join(dir, "index.html");
const src = fs.readFileSync(file, "utf-8");
const [S, E] = MARKERS;
if (!src.includes(S)) throw new Error(`index.html 에 ${S} / ${E} 표시가 없다`);
fs.writeFileSync(file, src.slice(0, src.indexOf(S) + S.length) + "\n" + render(md) + "\n" + src.slice(src.indexOf(E)));
console.log(`프로젝트 ${parse(md).length}건 반영: ${parse(md).map((p) => p.name).join(" · ")}`);
