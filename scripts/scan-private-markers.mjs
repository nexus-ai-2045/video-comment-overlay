import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const privateMarkers = [
  ["1476517988860", "694610"],
  ["1464854485779", "218535"],
  ["2026-07", "-06"],
  ["nexus", "_ai"],
  ["由宇", "霧"],
  ["yu", "giri"],
  ["いぬ", "にゃん"],
  ["ね", "く"]
].map((parts) => parts.join(""));

const ignoredDirs = new Set([".git", "node_modules"]);
const textExtensions = new Set([".bat", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ps1", ".sh", ".txt", ".yml", ".yaml"]);
const args = process.argv.slice(2);
const trackedOnly = args.includes("--tracked");
const roots = args.filter((arg) => arg !== "--tracked");

function gitTrackedFiles() {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

function walk(target) {
  const fullPath = path.resolve(target);
  if (!fs.existsSync(fullPath)) return [];
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [fullPath];
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) return [];
    return walk(path.join(fullPath, entry.name));
  });
}

const files = trackedOnly ? gitTrackedFiles() : (roots.length ? roots : ["."]).flatMap(walk);
const hits = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!textExtensions.has(ext)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const marker of privateMarkers) {
    const index = text.indexOf(marker);
    if (index >= 0) {
      const line = text.slice(0, index).split(/\r?\n/).length;
      hits.push(`${file}:${line}: private marker "${marker}"`);
    }
  }
}

if (hits.length) {
  console.error(hits.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, scanned: files.length, trackedOnly }, null, 2));
