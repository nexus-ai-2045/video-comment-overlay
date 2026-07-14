# Chromeコメント取得MVP

この拡張は、ユーザーが開いているDiscord / YouTube Live / Twitchのタブから、表示中のコメントDOMを読み取り、`video_comment_overlay.v1` JSONとして保存するMVPです。

## 読み込み

1. Chromeで `chrome://extensions` を開く。
2. デベロッパーモードを有効にする。
3. `パッケージ化されていない拡張機能を読み込む` から `extensions/chrome-capture/` を選ぶ。
4. Discord / YouTube Live / Twitchのコメント画面を開く。
5. 拡張のポップアップで `表示中コメントを取得` を押す。
6. 件数を確認し、`JSON保存` で保存する。

## 境界

- 取得できるのは、表示中またはページDOMに存在するコメントだけです。
- 完全履歴、非表示範囲、ログイン前の履歴取得は保証しません。
- cookie、token、browser profile、localStorage、sessionStorageは読みません。
- 外部サーバーへ送信しません。
- JSONはprivateデータとして扱い、repoや匿名デモZIPへ含めません。
