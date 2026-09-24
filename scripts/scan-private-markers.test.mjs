import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

const scanner = path.join(path.dirname(fileURLToPath(import.meta.url)), "scan-private-markers.mjs");
// Obviously fake dummy markers used only by these tests.
const DUMMY_A = "dummy-marker-alpha-000";
const DUMMY_B = "DUMMY_MARKER_BRAVO_111";

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-private-markers-"));
  tempDirs.push(dir);
  return dir;
}

function run(cwd, args, env = {}) {
  const baseEnv = { ...process.env };
  delete baseEnv.PRIVATE_MARKERS;
  delete baseEnv.PRIVATE_MARKERS_FILE;
  delete baseEnv.PRIVATE_MARKERS_REQUIRED;
  return spawnSync(process.execPath, [scanner, ...args], { cwd, env: { ...baseEnv, ...env }, encoding: "utf8" });
}

function sha12(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

test("scanner source contains no marker array", () => {
  const source = fs.readFileSync(scanner, "utf8");
  assert.doesNotMatch(source, /privateMarkers\s*=\s*\[/);
});

test("no marker source: skips with exit 0 and a clear notice", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "a.md"), `contains ${DUMMY_A}\n`);
  const result = run(dir, ["."]);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /private marker scan skipped/);
  assert.equal(JSON.parse(result.stdout).skipped, true);
});

test("no marker source with --require-markers or PRIVATE_MARKERS_REQUIRED=1 fails", () => {
  const dir = tempDir();
  assert.equal(run(dir, [".", "--require-markers"]).status, 2);
  assert.equal(run(dir, ["."], { PRIVATE_MARKERS_REQUIRED: "1" }).status, 2);
});

test("PRIVATE_MARKERS env: hit is reported with index and hash, value redacted", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "clean.md"), "nothing here\n");
  fs.writeFileSync(path.join(dir, "leak.md"), `line one\nline two ${DUMMY_B} tail\n`);
  const result = run(dir, ["."], { PRIVATE_MARKERS: `${DUMMY_A}\n${DUMMY_B}\n` });
  assert.equal(result.status, 1);
  const output = result.stdout + result.stderr;
  assert.match(output, /leak\.md:2: private marker #2 \(sha256:[0-9a-f]{12}\)/);
  assert.ok(output.includes(sha12(DUMMY_B)));
  assert.ok(!output.includes(DUMMY_A), "marker A value must not be printed");
  assert.ok(!output.includes(DUMMY_B), "marker B value must not be printed");
  assert.ok(!output.includes("tail"), "matched line content must not be printed");
  assert.ok(!output.includes("clean.md"));
});

test("default .private-markers.txt file: comments ignored, file itself not scanned", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, ".private-markers.txt"), `# comment line\n\n${DUMMY_A}\r\n`);
  fs.writeFileSync(path.join(dir, "ok.md"), "clean\n");
  const clean = run(dir, ["."]);
  assert.equal(clean.status, 0, clean.stderr);
  const summary = JSON.parse(clean.stdout);
  assert.equal(summary.markers, 1);
  assert.deepEqual(summary.sources, [".private-markers.txt"]);

  fs.writeFileSync(path.join(dir, "leak.json"), JSON.stringify({ name: DUMMY_A }));
  const dirty = run(dir, ["."]);
  assert.equal(dirty.status, 1);
  assert.match(dirty.stderr, /leak\.json:1: private marker #1 \(sha256:/);
  assert.ok(!(dirty.stdout + dirty.stderr).includes(DUMMY_A));
});

test("PRIVATE_MARKERS_FILE: custom path is used; missing path fails", () => {
  const dir = tempDir();
  const outside = tempDir();
  const markerFile = path.join(outside, "markers.txt");
  fs.writeFileSync(markerFile, `${DUMMY_B}\n`);
  fs.writeFileSync(path.join(dir, "leak.md"), `${DUMMY_B}\n`);
  const result = run(dir, ["."], { PRIVATE_MARKERS_FILE: markerFile });
  assert.equal(result.status, 1);
  assert.ok(!(result.stdout + result.stderr).includes(DUMMY_B));

  const missing = run(dir, ["."], { PRIVATE_MARKERS_FILE: path.join(outside, "nope.txt") });
  assert.equal(missing.status, 2);
});
