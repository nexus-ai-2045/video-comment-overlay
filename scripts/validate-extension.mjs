import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extensionDir = path.join(root, "extensions", "chrome-capture");
const manifestPath = path.join(extensionDir, "manifest.json");
const requiredFiles = ["manifest.json", "popup.html", "popup.css", "popup.js", "content-script.js", "README.md"];
const forbiddenPatterns = [
  /chrome\.cookies/,
  /document\.cookie/,
  /localStorage/,
  /sessionStorage/,
  /eval\s*\(/,
  /new Function\s*\(/,
  /https?:\/\/(?!discord\.com|www\.youtube\.com|youtube\.com|www\.twitch\.tv|twitch\.tv)/
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(extensionDir, file)));
if (missing.length) {
  console.error(`missing extension files: ${missing.join(", ")}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const allowedPermissions = new Set(["activeTab", "scripting", "downloads", "storage"]);
const unexpectedPermissions = (manifest.permissions || []).filter((permission) => !allowedPermissions.has(permission));
if (unexpectedPermissions.length) {
  console.error(`unexpected extension permissions: ${unexpectedPermissions.join(", ")}`);
  process.exit(1);
}

if ((manifest.permissions || []).includes("cookies")) {
  console.error("cookies permission is not allowed");
  process.exit(1);
}

const executableFiles = ["popup.js", "content-script.js"];
const requiredContentScriptSnippets = [
  "MutationObserver",
  "discordEngine",
  "backfillStep",
  "sourceRaw"
];
const requiredPopupSnippets = [
  "startDiscordLive",
  "backfillDiscord",
  "refreshDiscordSession",
  "保存範囲を確認"
];

for (const file of executableFiles) {
  const fullPath = path.join(extensionDir, file);
  const text = fs.readFileSync(fullPath, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      console.error(`${file}: forbidden pattern ${pattern}`);
      process.exit(1);
    }
  }
}

const contentScript = fs.readFileSync(path.join(extensionDir, "content-script.js"), "utf8");
const popupScript = fs.readFileSync(path.join(extensionDir, "popup.js"), "utf8");
const missingContentSnippets = requiredContentScriptSnippets.filter((snippet) => !contentScript.includes(snippet));
const missingPopupSnippets = requiredPopupSnippets.filter((snippet) => !popupScript.includes(snippet));

if (missingContentSnippets.length) {
  console.error(`content-script.js: missing Discord engine snippets: ${missingContentSnippets.join(", ")}`);
  process.exit(1);
}

if (missingPopupSnippets.length) {
  console.error(`popup.js: missing capture workflow snippets: ${missingPopupSnippets.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  extensionDir,
  files: requiredFiles.length,
  permissions: manifest.permissions
}, null, 2));
