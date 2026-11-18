# 配信コメント取得アダプタ設計

この文書は、配信URLからコメントを取得し、`video_comment_overlay.v1` JSONへ正規化するための設計メモです。実コメント本文、実URL、実ID、参加者名、avatar URL、画像、添付はこのrepoに含めません。

## 目的

- 配信単位で、開始時刻から終了時刻までのコメントを取得する。
- 取得結果を、このアプリが読める `video_comment_overlay.v1` JSONに正規化する。
- 画像、絵文字、スタンプ、添付は別ZIPや別フォルダとして保存し、JSONから参照できるようにする。
- 取得状況、未取得範囲、blocked理由をmanifestに残す。

## 共通出力

```text
capture-package/
  thread-comments.json
  source-raw.ndjson
  attachments/
  manifest.json
  README-private.md
```

`thread-comments.json` はアプリに読み込ませる正規化データです。`source-raw.ndjson` と `attachments/` はprivateデータとして扱います。

## 対象サービス

| サービス | 取得単位 | 初期入力 | 正規化先 |
|---|---|---|---|
| Discord | channel / thread / live event window | Discord URL、開始時刻、終了時刻 | `comments[]` |
| YouTube Live | video / live archive | YouTube URL、配信開始時刻、終了時刻 | `comments[]` |
| Twitch | VOD / channel live window | Twitch URL、配信開始時刻、終了時刻 | `comments[]` |

## manifestに残す項目

- `sourceType`: `discord` / `youtube_live` / `twitch`
- `sourceUrlSafeLabel`: 本文やtokenを含まないsafe label
- `requestedStartAt`
- `requestedEndAt`
- `confirmedStartAt`
- `confirmedEndAt`
- `messageCount`
- `participantCount`
- `attachmentCount`
- `emojiOrStickerCount`
- `coverage`: `full` / `partial` / `blocked`
- `missingRanges`
- `blockers`
- `createdAt`

## 実装境界

- repo本体には取得済みログを含めない。
- token、cookie、browser profile、個人パスを出力しない。
- APIやブラウザ操作が必要な取得は、read-onlyで行う。
- 取得できなかった範囲は `partial` または `blocked` としてmanifestに残す。
- 各サービスのHTMLを丸ごと保存してテンプレートとして同梱しない。画面再現はアプリ内の再現UIで行う。

## 次に作るもの

1. `scripts/normalize-comments.mjs`
   - Discord / YouTube Live / Twitchのraw JSONを `video_comment_overlay.v1` に変換する。
2. `scripts/package-capture.mjs`
   - JSON、raw、attachments、manifestをprivate packageとしてまとめる。
3. サービス別取得アダプタ
   - Discord: 既存raw / REST backfill結果を入力にする。
   - YouTube Live: エクスポート済みlive chat JSONを入力にする。
   - Twitch: VOD chat JSONを入力にする。

## 一般ユーザー向けの取得口

一般ユーザーが配信ページから自分でコメントを取得する場合は、Chrome拡張を別アダプタとして用意する方針にする。静的viewer本体から、ログイン済みのDiscord / YouTube Live / Twitchページを直接読む設計にはしない。

初期MVPは `extensions/chrome-capture/` にある。表示中DOMから見えている範囲を取得し、`visible-partial` の `video_comment_overlay.v1` JSONとして保存する。

詳細は [CAPTURE_EXTENSION_PLAN.md](CAPTURE_EXTENSION_PLAN.md) を参照。
