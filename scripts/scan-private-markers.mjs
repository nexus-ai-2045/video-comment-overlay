import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadPrivateMarkers } from "./private-markers.mjs";

// Private markers are never stored in this repository; see scripts/private-markers.mjs for sources.
// With no markers configured the scan is skipped with a WARNING and exit 0, unless
// --require-markers or PRIVATE_MARKERS_REQUIRED=1 is set (then exit 2).
// A marker file that is tracked or not gitignored is an error (exit 2).
// Hits are reported as file:line plus marker index and sha256 prefix; marker values are never printed.

const ignoredDirs = new Set([".git", "node_modules"]);
const textExtensions = new Set([".bat", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ps1", ".sh", ".txt", ".yml", ".yaml"]);
const args = process.argv.slice(2);
const trackedOnly = args.includes("--tracked");
const requireMarkers = args.includes("--require-markers") || process.env.PRIVATE_MARKERS_REQUIRED === "1";
const roots = args.filter((arg) => !arg.startsWith("--"));

function markerId(marker, index) {
  const hash = crypto.createHash("sha256").update(marker, "utf8").digest("hex").slice(0, 12);
  return `#${index + 1} (sha256:${hash})`;
}

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

const { markers, sources, markersFile, error } = loadPrivateMarkers();

if (error) {
  console.error(`ERROR: ${error}`);
  process.exit(2);
}

if (!markers.length) {
  const notice = "private marker scan skipped: no private markers configured (PRIVATE_MARKERS / PRIVATE_MARKERS_FILE / .private-markers.txt at the repo root).";
  if (requireMarkers) {
    console.error(`ERROR: ${notice} Failing because markers are required.`);
    process.exit(2);
  }
  console.error(`WARNING: ${notice}`);
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "no private markers configured", trackedOnly }, null, 2));
  process.exit(0);
}

// The marker file is only exempt here because loadPrivateMarkers verified it is untracked and gitignored.
const files = (trackedOnly ? gitTrackedFiles() : (roots.length ? roots : ["."]).flatMap(walk))
  .filter((file) => path.resolve(file) !== markersFile);
const hits = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!textExtensions.has(ext)) continue;
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  markers.forEach((marker, markerIndex) => {
    lines.forEach((line, lineIndex) => {
      if (line.includes(marker)) hits.push(`${file}:${lineIndex + 1}: private marker ${markerId(marker, markerIndex)}`);
    });
  });
}

if (hits.length) {
  console.error(hits.join("\n"));
  console.error(`${hits.length} private marker hit(s). Marker values are not printed; match the index/hash against your local marker list.`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, scanned: files.length, markers: markers.length, sources, trackedOnly }, null, 2));
