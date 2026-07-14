# リポジトリレビュー

最終更新: 2026-07-15

## 結論

`video-comment-overlay` は、匿名デモZIPを生成してローカルで試す用途には使える状態です。公開、外部共有、GitHub repository visibility変更は、このレビューだけでは許可しません。共有前には `SHARE_REVIEW.md` と生成ZIPの中身を人間が目視確認します。

## 確認済み

- 静的HTML/CSS/JSだけで起動できる。
- YouTube URL、ローカル動画、コメントJSON、Discord raw NDJSONを入力できる。
- LINE風、ニコニコ動画風、Discord風、字幕風の表示プリセットがある。
- コメント一覧、編集フォーム、シークバー、設定ドロワーがある。
- 匿名デモZIPは `npm run build:public-zip` で生成できる。
- tracked sourceと配布ZIPのprivate marker scanをローカルコマンドで確認できる。

## 改善済み

- private Discord fixtureをGit管理から外した。
- テスト用コメントデータもrepoから外し、必要に応じて別ファイルで渡す方針にした。
- READMEにZIP利用、ソース起動、JSON形式、検証、バージョン管理を追記した。
- Git由来のversion metadataをビルド成果物へ埋め込むようにした。
- GitHub Actions、Git hooks、テスト同梱はrepoから外した。

## 残る注意点

- `data/*.json` はローカルprivateデータまたは別渡しのテストデータであり、repoに含めない。
- `dist/` は生成物でありGit管理外。共有時は生成後にZIPを確認する。
- Discord URLからのライブ取得は未実装。現状はローカルJSON/NDJSON読込が中心。
- YouTube iframe APIの同期はブラウザとYouTube側の制約に依存する。

## 運用ゲート

変更前後:

```powershell
npm run verify
git status --short
```

共有前:

```powershell
npm run build:public-zip
node scripts/scan-private-markers.mjs dist/public-demo
```

公開前:

1. README、license、SECURITY.md、`PUBLIC_READY.md` を整える。
2. secret scan、personal path scan、source archive scanを通す。
3. repository visibility変更の対象と正確な操作を明示する。
4. 現在会話で人間レビューと明示承認を得る。
