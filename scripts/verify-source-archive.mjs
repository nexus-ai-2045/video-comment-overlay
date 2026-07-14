import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function runNpm(args, cwd) {
  if (process.platform === "win32") {
    run("cmd", ["/c", "npm", ...args], cwd);
    return;
  }
  run("npm", args, cwd);
}

const root = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vco-source-archive-"));
const archivePath = path.join(tempRoot, "source.zip");
const sourceDir = path.join(tempRoot, "src");

try {
  run("git", ["archive", "--format=zip", "--output", archivePath, "HEAD"], root);
  fs.mkdirSync(sourceDir, { recursive: true });
  run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Expand-Archive -LiteralPath '${archivePath.replaceAll("'", "''")}' -DestinationPath '${sourceDir.replaceAll("'", "''")}' -Force`], root);
  run("node", ["scripts/scan-private-markers.mjs", "."], sourceDir);
  runNpm(["run", "build:public-zip"], sourceDir);
  const zipPath = path.join(sourceDir, "dist", "video-comment-overlay-public-demo.zip");
  if (!fs.existsSync(zipPath)) throw new Error(`missing ${zipPath}`);
  console.log(JSON.stringify({ ok: true, archivePath, zipPath }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
