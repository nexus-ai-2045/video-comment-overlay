# 変更履歴

このプロジェクトは、リリース単位で `package.json` の `version` を更新します。配布ZIPには、ビルド時点のGit commit、branch、dirty状態を `version.json` と画面表示へ埋め込みます。

## 0.1.0 - public-ready MVP候補

- 静的viewerで動画同期コメントオーバーレイを表示。
- LINE風、ニコニコ動画風、Discord風、字幕風の表示プリセットを追加。
- Discord / YouTube Live / Twitch風の再現画面を追加。
- コメント一覧、コメント編集、シークバー、録画設定、WebM保存を追加。
- Chrome拡張MVPで表示中DOMから `visible-partial` コメントJSONを保存。
- 匿名デモZIPとChrome拡張ZIPの生成コマンドを追加。
- private marker scan、拡張権限検証、公開前チェックリストを追加。
