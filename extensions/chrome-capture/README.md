# Chromeコメント取得MVP

この拡張は、ユーザーが開いているDiscord / YouTube Live / Twitchのタブから、表示中のコメントDOMを読み取り、`video_comment_overlay.v1` JSONとして保存するMVPです。

## 読み込み

1. ZIPで受け取った場合は展開する。repoから使う場合はこのフォルダをそのまま使う。
2. Chromeで `chrome://extensions` を開く。
3. デベロッパーモードを有効にする。
4. `パッケージ化されていない拡張機能を読み込む` から `extensions/chrome-capture/`、またはZIPを展開したフォルダを選ぶ。
5. Discord / YouTube Live / Twitchのコメント画面を開く。
6. 拡張のポップアップで `表示中コメントを取得` を押す。
7. 件数を確認し、`JSON保存` で保存する。

## ZIP生成

repo内では次で拡張ZIPを作れます。

```powershell
npm run build:extension-zip
```

生成先:

`dist/video-comment-overlay-chrome-capture.zip`

Chromeの `パッケージ化されていない拡張機能を読み込む` はZIPファイルを直接選ぶのではなく、展開済みフォルダを選びます。

## 境界

- 取得できるのは、表示中またはページDOMに存在するコメントだけです。
- 完全履歴、非表示範囲、ログイン前の履歴取得は保証しません。
- cookie、token、browser profile、localStorage、sessionStorageは読みません。
- 外部サーバーへ送信しません。
- JSONはprivateデータとして扱い、repoや匿名デモZIPへ含めません。
