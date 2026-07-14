# 共有前レビュー

このリポジトリは private 前提です。外部公開、URL共有、GitHub visibility 変更、デプロイは、現在会話で対象と操作を明示した人間レビュー後にだけ行います。

## データ境界

| パス | 扱い | 理由 |
|---|---|---|
| `data/thread-comments.json` | private / Git管理外 | Discord由来の本文、参加者名、avatar URL、実URLを含む |
| `data/thread-comments.partial-known-20260714.json` | private / Git管理外 | 同上。取得状況のアーカイブ |
| `data/comments.sample.json` | private / Git管理外 | 実URL、実参加者名、元日時を含む古いサンプル |
| `data/comments.public-demo.json` | 共有候補 | 匿名化デモ。実Discord ID、実参加者名、avatar URL、実本文、添付を含めない |
| `dist/public-demo/` | 共有候補 | `comments.public-demo.json` を `thread-comments.json` として同梱した静的デモ |
| `dist/video-comment-overlay-public-demo.zip` | 共有候補 | `dist/public-demo/` をZIP化した匿名デモ。展開後に `index.html` で起動できる |

## 現在の取得状況

実Discordログの取得状況はローカルprivateデータとして扱います。共有候補には匿名デモだけを入れます。

## 共有候補の作り方

```powershell
npm run build:public-zip
node scripts/scan-private-markers.mjs dist/public-demo
```

生成物:

`dist/public-demo/`

`dist/video-comment-overlay-public-demo.zip`

このフォルダまたはZIPを共有する場合も、事前に中身を人間レビューしてください。

## レビュー観点

- `README-public-demo.md` が展開後の起動手順を説明している。
- `version.json` に生成時点のversion metadataが入っている。
- `data/thread-comments.json` は匿名デモであり、実Discord URL、実ID、実参加者名、avatar URL、実本文、添付を含まない。
- `node scripts/scan-private-markers.mjs dist/public-demo` が成功する。
