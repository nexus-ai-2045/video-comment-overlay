# セキュリティ方針

このリポジトリは現在 private 前提です。public化、外部共有、配布、GitHub visibility変更は、公開前レビューと現在会話での明示承認があるまで行いません。

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

## 公開前の扱い

public化前は、脆弱性報告・レビュー・共有はprivate GitHub repo内または現在会話で扱います。public化後に必要であれば、GitHub Security Advisoriesや専用連絡先を設定します。
