# セキュリティ方針

このリポジトリは GitHub 上ですでに public です。追加の外部共有、配布、デプロイ、Release作成は、レビューと現在会話での明示承認があるまで行いません。visibility 変更は行いません。

## 対象

- 静的viewer本体
- Chromeコメント取得MVP
- 匿名デモZIP

## 報告してほしいもの

- 実ログ、実URL、実ID、参加者名、avatar URL、添付がrepoや匿名デモZIPに混ざる問題
- Chrome拡張がcookie、token、browser profile、localStorage、sessionStorageなどを読む問題
- 取得データが外部へ送信される問題
- `visible-partial` の取得結果が完全履歴のように扱われる問題

## 既知の境界

- Chrome拡張MVPは、表示中DOMに存在するコメントだけを取得します。完全履歴は保証しません。
- 実コメントJSON、rawログ、添付、画像はprivateデータです。repoや匿名デモZIPには含めません。
- 録画はブラウザの画面共有とMediaRecorderを使い、ローカルで完結します。

## 報告の扱い

脆弱性報告・レビューは、GitHub Issues、GitHub Security Advisories、または現在会話で扱います。必要に応じて専用連絡先を追加します。
