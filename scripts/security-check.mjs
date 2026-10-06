import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

if (/\.innerHTML\s*=|\.insertAdjacentHTML\s*\(/.test(source)) {
  throw new Error("蜊ｱ髯ｺ縺ｪHTML謖ｿ蜈･sink縺瑚ｦ九▽縺九ｊ縺ｾ縺励◆縲ＵextContent/DOM API繧剃ｽｿ逕ｨ縺励※縺上□縺輔＞縲・);
}

if (/localVideo\.src\s*=/.test(source)) {
  throw new Error("繝ｭ繝ｼ繧ｫ繝ｫ蜍慕判URL繧奪OM繝励Ο繝代ユ繧｣縺ｸ逶ｴ謗･莉｣蜈･縺励↑縺・〒縺上□縺輔＞縲・);
}

if (!/parsedUrl\.protocol\s*!==\s*["']blob:["']/.test(source)) {
  throw new Error("繝ｭ繝ｼ繧ｫ繝ｫ蜍慕判縺ｮblob URL讀懆ｨｼ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・);
}

const textContentWrites = (source.match(/\.textContent\s*=/g) || []).length;
if (textContentWrites === 0) {
  throw new Error("繧ｳ繝｡繝ｳ繝郁｡ｨ遉ｺ縺ｮtextContent蠅・阜縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・);
}

console.log(`DOM security boundary ok: ${textContentWrites} textContent writes`);
