# 共有前レビュー

このリポジトリは private 前提です。外部公開、URL共有、GitHub visibility 変更、デプロイは、現在会話で対象と操作を明示した人間レビュー後にだけ行います。

## データ境界

| パス | 扱い | 理由 |
|---|---|---|
| `data/*.json` | repo外 | privateログやテストデータはrepoに含めず、必要に応じて別ファイルで渡す |
| `dist/public-demo/` | 共有候補 | ビルド時に生成した匿名デモJSONを `thread-comments.json` として同梱した静的デモ |
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
- `dist/public-demo/data/thread-comments.json` は匿名デモであり、実Discord URL、実ID、実参加者名、avatar URL、実本文、添付を含まない。
- `node scripts/scan-private-markers.mjs dist/public-demo` が成功する。
