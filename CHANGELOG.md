# 変更履歴

このプロジェクトは、リリース単位で `package.json` の `version` を更新します。配布ZIPには、ビルド時点のGit commit、branch、dirty状態を `version.json` と画面表示へ埋め込みます。

## Unreleased

- private marker scanの検出対象をscriptから削除し、環境変数 `PRIVATE_MARKERS` / `PRIVATE_MARKERS_FILE` またはgitignore済みの `.private-markers.txt` から読むように変更。
- 検出結果はファイル・行・marker番号・sha256先頭だけを表示し、markerの値を出さないように変更。
- marker未設定時はscanをskipしてexit 0 (`--require-markers` / `PRIVATE_MARKERS_REQUIRED=1` で失敗に変更可能)。
- `npm run test` (node:test) を追加し、`npm run verify` に組み込み。
- markerファイルがgit work tree内でtrackedまたはgitignoreされていない場合はexit 2で失敗するように変更。
- markerファイルがsymlinkの場合はlink先の実ファイルもtracked / gitignore検査の対象にし、通常のファイルでない場合もexit 2で失敗するように変更。
- 既定の `.private-markers.txt` をcwdではなくgit work treeのrootから探すように変更。
- marker未設定時は `WARNING: private marker scan skipped` を表示し、`public-ready-check` にもWARNINGとして表示。

## 0.1.1 - public前の配布導線調整

- Chrome拡張の保存前プレビューと保存範囲指定を追加。
- timestampと動画開始日時からコメントtimeを再計算し、開始前コメントを除外できるように変更。
- コメント本文を出さずに時間軸を検査する `npm run validate:timeline` を追加。
- ZIP起動スクリプトが一時HTTPサーバーを立てることをREADMEと配布READMEに明記。
- GitHub Releasesを使う `更新確認` ボタンを追加。
- Chrome拡張導入ガイドとスクショを追加。

## 0.1.0 - public-ready MVP候補

- 静的viewerで動画同期コメントオーバーレイを表示。
- LINE風、ニコニコ動画風、Discord風、字幕風の表示プリセットを追加。
- Discord / YouTube Live / Twitch風の再現画面を追加。
- コメント一覧、コメント編集、シークバー、録画設定、WebM保存を追加。
- Chrome拡張MVPで表示中DOMから `visible-partial` コメントJSONを保存。
- 匿名デモZIPとChrome拡張ZIPの生成コマンドを追加。
- private marker scan、拡張権限検証、公開前チェックリストを追加。
