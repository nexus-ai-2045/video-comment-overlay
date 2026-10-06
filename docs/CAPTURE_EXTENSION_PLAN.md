# Chrome拡張によるコメント取得方針

最終更新: 2026-07-15

## 結論

一般ユーザー向けに配信コメントを取得する口を用意するなら、Chrome拡張を本命の取得アダプタとして分けるのがよいです。

このrepo本体は、保存済みコメントJSONを読み込み、動画や配信風テンプレートへ同期表示し、必要なら録画する静的ビューアとして保ちます。ブラウザ上のDiscord、YouTube Live、Twitchからコメントを集める処理は、別のChrome拡張として扱います。

## なぜ分けるか

- 配信ページのコメントは、ログイン状態、CORS、DOM構造、利用規約、API制限に強く依存する。
- 静的HTMLアプリから任意サイトのコメントDOMや認証済みAPIを直接読むのは難しい。
- Chrome拡張なら、ユーザーが開いている対象タブに限定して、content scriptで表示中のコメントを読み取れる。
- viewer本体と取得拡張を分けると、共有ZIPは匿名デモのまま維持でき、取得側の権限レビューも明確になる。

## Chrome拡張の役割

- ユーザーが開いているDiscord、YouTube Live、Twitchのタブを対象にする。
- 明示的なクリック操作で取得を開始する。
- 表示中またはスクロールで到達できるコメントを読み取る。
- 取得できた範囲、未取得範囲、blocked理由をmanifestに残す。
- `video_comment_overlay.v1` JSONへ正規化する。
- 画像、絵文字、スタンプ、添付はローカルZIPにまとめ、JSONから相対参照する。
- 外部サーバーへ送信せず、ブラウザのdownload APIでローカル保存する。

## やらないこと

- cookie、token、browser profile、localStorageを抜き出さない。
- ユーザーの代わりに投稿、送信、削除、設定変更をしない。
- サービスのHTMLを丸ごとテンプレートとして同梱しない。
- 取得できていない範囲を、取得済みのように扱わない。
- viewer本体の匿名デモZIPに実ログや実URLを混ぜない。

## 権限の初期案

Manifest V3 を前提にします。

| 対象 | 権限 |
|---|---|
| Discord | `https://discord.com/*` |
| YouTube | `https://www.youtube.com/*` |
| Twitch | `https://www.twitch.tv/*` |
| 保存 | `downloads` |
| アクティブタブ操作 | `activeTab`, `scripting` |
| 状態保存 | `storage` |

host permissionsは広げすぎず、最初はDiscord / YouTube / Twitchだけにします。

## 取得フロー

1. ユーザーが対象の配信ページまたはチャット画面を開く。
2. 拡張のポップアップで `Discord` / `YouTube Live` / `Twitch` を選ぶ。
3. `取得開始` を押す。
4. content scriptがコメントDOMまたは公開されているページ内データを読む。
5. 必要に応じて、ユーザー操作を前提に過去コメントへスクロールする。
6. 取得完了または中断時に、manifest付きZIPを保存する。
7. viewer本体で `thread-comments.json` を読み込む。

## サービス別メモ

| サービス | 初期方針 | 注意 |
|---|---|---|
| Discord | 表示中DOMとスクロール到達分を取得。DCBやREST backfillは上級者向け別経路にする | 完全履歴は権限やbot tokenなしでは保証しない |
| YouTube Live | live chat replay / 表示中チャットDOM / エクスポート済みJSONを入力候補にする | archive状態、地域、UI変更の影響を受ける |
| Twitch | VOD chat相当データ、表示中チャットDOM、エクスポート済みJSONを入力候補にする | VODとliveで取得口が変わる |

## 出力パッケージ

```text
capture-package/
  thread-comments.json
  source-raw.ndjson
  attachments/
  manifest.json
  README-private.md
```

`thread-comments.json` はviewerに渡す正規化済みデータです。`source-raw.ndjson`、`attachments/`、元URL、実参加者名、avatar URLはprivate扱いにします。

## 実装の置き場所

初期MVPは、このrepoの `extensions/chrome-capture/` に置く案が扱いやすいです。viewerと同じJSON schemaを共有しながら、配布物と権限レビューを分けられます。

将来、Chrome拡張だけを単独で配布する段階になったら、`video-comment-capture-extension` のような別private repoへ分けます。

## MVPの停止線

- Discord / YouTube Live / Twitchのうち、まず1サービスでJSON出力まで通す。
- 取得範囲がpartialの場合はmanifestに明記する。
- 実ログ、実URL、実ID、参加者名、avatar URL、添付をrepoに入れない。
- `npm run verify` とprivate marker scanを通す。
