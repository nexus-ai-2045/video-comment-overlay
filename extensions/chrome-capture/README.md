# Chromeコメント取得MVP

この拡張は、ユーザーが開いているDiscord / YouTube Live / Twitchのタブから、表示中のコメントDOMを読み取り、`video_comment_overlay.v1` JSONとして保存するMVPです。

Discordでは、表示中DOMの単発取得に加えて、ページ内に常駐するキャプチャエンジンを使えます。Bot/APIが使えない場面でも、ユーザー本人がChromeで閲覧できる範囲を、Live観測または過去方向のステップ取得としてローカル保存します。

## 読み込み

詳しい手順は `docs/CHROME_EXTENSION_INSTALL.md` を参照してください。

1. ZIPで受け取った場合は展開する。repoから使う場合はこのフォルダをそのまま使う。
2. Chromeで `chrome://extensions` を開く。
3. デベロッパーモードを有効にする。
4. `パッケージ化されていない拡張機能を読み込む` から `extensions/chrome-capture/`、またはZIPを展開したフォルダを選ぶ。
5. Discord / YouTube Live / Twitchのコメント画面を開く。
6. Discordの場合は、必要に応じて `Live開始` または `過去へ1ステップ` を使う。
7. 拡張のポップアップで `表示中コメントを取得` を押す。
8. 件数、先頭/末尾の時刻、プレビューを確認する。
9. 必要なら `保存開始` / `保存終了` で範囲を狭める。
10. `JSON保存` で保存する。

## Discordキャプチャ

| 操作 | 役割 |
|---|---|
| 表示中コメントを取得 | 現在DOMにあるメッセージを1回読み、保存プレビューへ反映します |
| Live開始 | DOM変化を監視し、以後表示されるメッセージを重複排除しながら蓄積します |
| 停止 | Live監視を止めます。蓄積済みコメントはページを閉じるまで保持されます |
| 過去へ1ステップ | Discordのメッセージスクロール領域を少し上へ戻し、到達した範囲を追加取得します |
| 状態更新 | 蓄積件数、先頭/末尾時刻、直近スキャン結果を読み直します |

Discordは仮想スクロールのため、画面外の全履歴がDOMに存在するとは限りません。保存JSONには `chrome-extension-captured-partial` と停止理由を入れ、完全履歴としては扱いません。

## ZIP生成

repo内では次で拡張ZIPを作れます。

```powershell
npm run build:extension-zip
```

生成先:

`dist/video-comment-overlay-chrome-capture.zip`

Chromeの `パッケージ化されていない拡張機能を読み込む` はZIPファイルを直接選ぶのではなく、展開済みフォルダを選びます。

## 境界

- 取得できるのは、表示中、Live観測済み、またはステップ取得で到達したコメントだけです。
- 完全履歴、非表示範囲、ログイン前の履歴取得は保証しません。
- cookie、token、browser profile、localStorage、sessionStorageは読みません。
- 外部サーバーへ送信しません。
- JSONはprivateデータとして扱い、repoや匿名デモZIPへ含めません。
