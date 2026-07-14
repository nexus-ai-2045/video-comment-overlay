import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "PUBLIC_READY.md",
  "CHANGELOG.md",
  "SHARE_REVIEW.md",
  "docs/ADVERSARIAL_REVIEW.md",
  "docs/PUBLICATION_INVENTORY.md",
  "extensions/chrome-capture/README.md"
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const pkg = readJson("package.json");
const failures = [];

if (missing.length) failures.push(`missing required files: ${missing.join(", ")}`);
if (pkg.license !== "MIT") failures.push(`package.json license must be MIT, got ${pkg.license || "empty"}`);
if (!/^\d+\.\d+\.\d+/.test(pkg.version || "")) failures.push(`package.json version must be semver-like, got ${pkg.version || "empty"}`);

const licenseText = fs.existsSync(path.join(root, "LICENSE")) ? fs.readFileSync(path.join(root, "LICENSE"), "utf8") : "";
if (!licenseText.includes("MIT License")) failures.push("LICENSE must contain MIT License");

const status = run("git", ["status", "--porcelain"]);
const trackedStatus = status
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((line) => !line.includes(" dist/") && !line.includes(" data/"));

if (trackedStatus.length) {
  failures.push(`tracked worktree is not clean: ${trackedStatus.join("; ")}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  packageVersion: pkg.version,
  license: pkg.license,
  requiredFiles: requiredFiles.length
}, null, 2));
