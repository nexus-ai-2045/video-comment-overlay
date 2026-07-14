import fs from "node:fs";
import path from "node:path";
import { getVersionInfo, versionScript } from "./version-info.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "data", "thread-comments.json");
const distDir = path.join(root, "dist", "public-demo");

const demoNames = ["参加者A", "参加者B", "参加者C", "参加者D", "参加者E", "参加者F", "参加者G"];
const demoTexts = [
  "コメントを動画の上に重ねるテストです。",
  "吹き出し表示、けっこう見やすい。",
  "ニコ動風に流すのもありですね。",
  "Discord風の密度も残したい。",
  "ここは少し表示時間を伸ばしたいかも。",
  "シークバーで戻れるの便利。",
  "共有用は匿名データで確認します。"
];
const colors = ["#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#eb5757", "#00a6a6", "#5865f2"];
const fallbackComments = demoTexts.map((text, index) => ({
  id: `seed-comment-${index + 1}`,
  authorId: `seed-user-${(index % 3) + 1}`,
  authorName: demoNames[index % 3],
  time: 1 + index * 3,
  text,
  kind: "message",
  emoji: [],
  stickers: [],
  attachments: []
}));

function copyFile(relativePath) {
  const src = path.join(root, relativePath);
  const dst = path.join(distDir, relativePath);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function writePublicIndex(demoData, versionInfo) {
  const source = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const embedScript = [
    "<script>",
    versionScript(versionInfo).trim(),
    `window.VCO_EMBEDDED_THREAD_COMMENTS = ${JSON.stringify(demoData)};`,
    "</script>"
  ].join("\n");
  const html = source.replace(
    '<script src="src/version.js"></script>\n    <script src="src/app.js"></script>',
    `${embedScript}\n    <script src="src/app.js"></script>`
  );
  fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");
}

const sourceData = fs.existsSync(sourcePath)
  ? JSON.parse(fs.readFileSync(sourcePath, "utf8"))
  : { comments: fallbackComments };
const authorMap = new Map();
const participants = {};

const comments = sourceData.comments.map((comment, index) => {
  if (!authorMap.has(comment.authorId)) {
    const nextIndex = authorMap.size;
    const id = `demo-user-${nextIndex + 1}`;
    authorMap.set(comment.authorId, {
      id,
      name: demoNames[nextIndex % demoNames.length],
      color: colors[nextIndex % colors.length]
    });
  }
  const author = authorMap.get(comment.authorId);
  participants[author.id] = {
    name: author.name,
    color: author.color,
    avatarUrl: ""
  };
  return {
    id: `demo-comment-${index + 1}`,
    authorId: author.id,
    authorName: author.name,
    time: comment.time,
    text: demoTexts[index % demoTexts.length],
    kind: comment.kind || "message",
    emoji: [],
    stickers: [],
    attachments: []
  };
});

const demoData = {
  schema: "video_comment_overlay.v1",
  source: {
    type: "demo",
    coverage: "public-demo",
    note: "共有レビュー用の匿名デモデータ。実Discord ID、URL、参加者名、avatar URL、本文、添付は含めない。"
  },
  timeline: {
    videoStartAt: "2026-01-01T00:00:00+09:00",
    commentTimeMode: "absolute"
  },
  participants,
  comments,
  integrity: {
    messageCount: comments.length,
    participantCount: Object.keys(participants).length,
    attachmentCount: 0,
    sanitized: true
  }
};
const versionInfo = getVersionInfo(root);

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
writePublicIndex(demoData, versionInfo);
copyFile(path.join("src", "app.js"));
copyFile(path.join("src", "styles.css"));
copyFile(path.join("docs", "DATA_HANDOFF.md"));
fs.mkdirSync(path.join(distDir, "data"), { recursive: true });
fs.writeFileSync(path.join(distDir, "data", "thread-comments.json"), `${JSON.stringify(demoData, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(distDir, "version.json"), `${JSON.stringify(versionInfo, null, 2)}\n`, "utf8");
fs.writeFileSync(
  path.join(distDir, "start-windows.bat"),
  [
    "@echo off",
    "cd /d %~dp0",
    "python -m http.server 8765",
    ""
  ].join("\r\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(distDir, "start-mac-linux.sh"),
  [
    "#!/usr/bin/env sh",
    "cd \"$(dirname \"$0\")\"",
    "python3 -m http.server 8765",
    ""
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(distDir, "README-public-demo.md"),
  [
    "# video-comment-overlay public demo",
    "",
    "このフォルダは、ZIPを展開した人がそのまま試せる匿名デモです。",
    "実Discord URL、実ID、参加者名、avatar URL、本文、添付は含めていません。",
    "",
    "## いちばん簡単な使い方",
    "",
    "1. ZIPを展開します。",
    "2. `index.html` をブラウザで開きます。",
    "3. 必要ならYouTube URL、ローカル動画、コメントJSONを読み込みます。",
    "4. Discord風の再現だけを見たい場合は、画面モードで `Discord再現` を選びます。",
    "5. 録画したい場合は `画面録画開始` からブラウザの共有選択を使い、最後に `WebM保存` します。",
    "",
    "## ブラウザでローカルファイルが制限される場合",
    "",
    "Windows:",
    "",
    "```powershell",
    ".\\start-windows.bat",
    "```",
    "",
    "macOS / Linux:",
    "",
    "```sh",
    "sh ./start-mac-linux.sh",
    "```",
    "",
    "起動後に `http://127.0.0.1:8765/` を開きます。",
    "",
    "## 実データを別で受け取った場合",
    "",
    "`コメントJSON` から別渡しのJSONを選びます。",
    "元ログ、実参加者名、avatar URL、画像、添付はこのZIPには含めていません。",
    "詳しくは `docs/DATA_HANDOFF.md` を参照してください。",
    "",
    "## 手動起動",
    "",
    "```powershell",
    "python -m http.server 8765",
    "```"
  ].join("\n"),
  "utf8"
);

console.log(JSON.stringify({
  ok: true,
  distDir,
  version: versionInfo.label,
  comments: comments.length,
  participants: Object.keys(participants).length
}, null, 2));
