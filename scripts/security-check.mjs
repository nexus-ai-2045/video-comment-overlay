import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

if (/\.innerHTML\s*=|\.insertAdjacentHTML\s*\(/.test(source)) {
  throw new Error("危険なHTML挿入の書き方が見つかりました。textContentかDOM APIを使ってください。");
}

if (/localVideo\.src\s*=/.test(source)) {
  throw new Error("ローカル動画のURLをDOMのプロパティへ直接代入しないでください。");
}

if (!/parsedUrl\.protocol\s*!==\s*["']blob:["']/.test(source)) {
  throw new Error("ローカル動画のblob URLの検証が見つかりません。");
}

const textContentWrites = (source.match(/\.textContent\s*=/g) || []).length;
if (textContentWrites === 0) {
  throw new Error("コメント表示のtextContentの境界が見つかりません。");
}

console.log(`DOM security boundary ok: ${textContentWrites} textContent writes`);
