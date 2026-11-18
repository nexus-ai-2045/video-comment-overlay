# 仕様: 動画同期コメントオーバーレイ

## 入力

### 動画

対応する入力は2種類です。

- YouTube URL
- ローカル動画ファイル

YouTube URLは `https://www.youtube.com/watch?v=...`、`https://youtu.be/...`、`/embed/...` を受け付けます。

ローカル動画はブラウザが再生できる形式に依存します。例: `mp4`, `webm`。

### コメント

コメントはJSONファイルで読み込みます。編集・差し替えがしやすいように、1ファイルにメタ情報とコメント配列を持たせます。

```json
{
  "schema": "video_comment_overlay.v1",
  "source": {
    "type": "discord",
    "url": "https://discord.com/channels/server/channel",
    "capturedAt": "2026-01-01T00:05:00+09:00"
  },
  "timeline": {
    "videoStartAt": "2026-01-01T00:00:00+09:00",
    "commentTimeMode": "absolute"
  },
  "participants": {
    "user-id": {
      "name": "表示名",
      "avatarUrl": "",
      "color": "#2f80ed"
    }
  },
  "comments": [
    {
      "id": "message-id",
      "authorId": "user-id",
      "authorName": "表示名",
      "time": 0,
      "timestamp": "2026-01-01T00:00:00+09:00",
      "text": "コメント本文",
      "kind": "message",
      "emoji": [],
      "stickers": [],
      "attachments": []
    }
  ]
}
```

`time` は動画開始からの秒数です。`timestamp` がある場合、`timeline.videoStartAt` との差分から自動計算できます。

## Discord URL取得方針

将来的には、Discord URLを指定してログを取得し、このJSON形式へ変換します。

優先順は次の通りです。

1. ローカル保存済み raw snapshot / NDJSON を読む。初期実装はここまで対応する。
2. 読み取り専用のDiscord Context Bridgeで取得する。
3. Chrome可視範囲のread-only snapshotを使う。
4. 取得できない範囲は未取得としてmanifestに残す。

Discordへの送信、reaction、削除、編集、外部投稿は行いません。

初期実装では、Discord URLは取得元メタ情報として扱います。ブラウザからDiscordへ直接ログ取得する処理は、認証・権限・CORS・安全境界の都合で入れません。ライブ取得は別アダプタで読み取り専用に実装します。

## 表示モード

### 吹き出し

LINE風の吹き出しを画面上に積む。投稿者ごとに色とアイコンを固定する。

### 弾幕

ニコニコ動画風に右から左へ流す。短いコメント向き。

### ティッカー

下部に横流しで表示する。講演動画や会合ログ向き。

### ポップアップ

画面の上部または指定レーンに短時間だけ表示する。

## アイコン・絵文字・スタンプ

- `avatarUrl`: 投稿者アイコン。
- `emoji`: 本文中の絵文字またはカスタム絵文字。
- `stickers`: Discord sticker相当。
- `attachments`: 添付画像、動画、ファイル。

初期実装では、通常絵文字は本文としてそのまま表示します。`avatarUrl` がある場合はアイコンとして表示します。

## 編集・差し替え

コメントJSONはローカルで自由に修正できます。ビューア上の「コメントJSON」入力から差し替えます。

今後の拡張候補:

- JSONエクスポート
- NDJSONインポート
- Discord raw snapshotからの変換
- 表示タイミングの手動補正
- 投稿者ごとの色固定テーブルの保存
