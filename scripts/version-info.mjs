import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function readPackage(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
}

export function getVersionInfo(root = process.cwd()) {
  const pkg = readPackage(root);
  const commit = git(["rev-parse", "--short=12", "HEAD"], root);
  const branch = git(["branch", "--show-current"], root) || "archive";
  const tag = git(["describe", "--tags", "--exact-match"], root);
  const describe = git(["describe", "--tags", "--always", "--dirty"], root);
  const dirty = Boolean(git(["status", "--porcelain"], root));
  const source = commit ? "git" : "package";
  const label = tag || describe || `v${pkg.version}`;

  return {
    name: pkg.name,
    packageVersion: pkg.version,
    label,
    commit: commit || null,
    branch,
    dirty,
    source,
    generatedAt: new Date().toISOString()
  };
}

export function versionScript(versionInfo) {
  return `window.VCO_VERSION = ${JSON.stringify(versionInfo, null, 2)};\n`;
}
