# 別渡しデータ手順

このrepoには、実Discordログ、実URL、参加者名、avatar URL、画像、添付、テスト用コメントJSONを含めません。アプリ本体はGitHubのsource ZIPまたはデモZIPで渡し、実データは別ファイルとして渡します。

## 渡すもの

| 種別 | 例 | repoに含めるか |
|---|---|---|
| アプリ本体 | GitHub source ZIP / `dist/video-comment-overlay-public-demo.zip` | 含める |
| コメントJSON | `thread-comments.json` | 含めない |
| 元ログ | Discord raw NDJSON / raw JSONL | 含めない |
| 画像・添付 | `attachments.zip` | 含めない |
| 取得状況メモ | 件数、時刻範囲、不足範囲、取得方法 | 必要なら別渡し |

## JSONを読む方法

1. ZIPを展開して `index.html` を開きます。
2. うまく読めない場合は、同梱の起動スクリプトまたは `python -m http.server 8765` でローカルサーバーを立てます。
3. 画面上の `コメントJSON` から別渡しの `thread-comments.json` を選びます。
4. `画面モード` で `動画オーバーレイ`、`Discord再現`、`YouTube Live再現`、`Twitch再現` を選びます。

## JSONの形

```json
{
  "schema": "video_comment_overlay.v1",
  "source": {
    "type": "discord",
    "coverage": "partial-known"
  },
  "timeline": {
    "videoStartAt": "2026-01-01T00:00:00+09:00",
    "commentTimeMode": "absolute"
  },
  "participants": {
    "user-1": {
      "name": "表示名",
      "color": "#5865f2",
      "avatarUrl": ""
    }
  },
  "comments": [
    {
      "id": "comment-1",
      "authorId": "user-1",
      "authorName": "表示名",
      "time": 0,
      "timestamp": "2026-01-01T00:00:00+09:00",
      "text": "動画開始時点のコメント",
      "attachments": []
    }
  ]
}
```

`time` は動画開始からの秒数です。`timestamp` は残しておくと後から再計算しやすくなります。

## 録画用の流れ

1. `Discord再現`、`YouTube Live再現`、`Twitch再現` のいずれかを選びます。
2. コメントJSONを読み込みます。
3. 必要ならシークバーで開始位置を確認します。
4. `録画品質`、`fps`、`bitrate Mbps`、`codec` を選びます。
5. `録画診断` でブラウザの録画エンジン対応を確認します。
6. `画面録画開始` を押し、ブラウザの共有選択でこのタブまたはウィンドウを選びます。
7. コメント再生を開始します。
8. 終了位置で `録画停止` を押し、`WebM保存` します。

録画はブラウザ内で完結します。アプリは録画ファイルを外部送信しません。

`WebM` はブラウザ録画で扱いやすいWeb向け動画形式です。編集ソフトや納品先によっては、録画後にMP4へ変換して使います。

| 品質 | 目安 |
|---|---|
| `HD 720p` | 軽い確認用 |
| `Full HD 1080p` | YouTube素材の標準候補 |
| `QHD 1440p` | 文字の輪郭を残したい場合 |
| `30fps` | 通常のチャット再現 |
| `60fps` | スクロールや弾幕の滑らかさ優先 |
| `12Mbps` | Full HDの初期値 |
| `20Mbps` 以上 | QHDや細かい文字の保持優先 |

実際の録画解像度は、ブラウザの画面共有で選んだタブ、ウィンドウ、ディスプレイの実サイズにも左右されます。録画開始後のステータスに、実キャプチャ解像度とfpsが表示されます。

## 配信元ごとの扱い

| 配信元 | 渡すデータ | 備考 |
|---|---|---|
| Discord | Discord raw NDJSON または正規化済みJSON | 現在の主対応 |
| YouTube Live | 正規化済みJSON | Live chat取得アダプタは別実装 |
| Twitch | 正規化済みJSON | VOD chat取得アダプタは別実装 |

各サービスの実画面HTMLはrepoに同梱しません。テンプレートは、合成素材として使いやすいように構造と密度を寄せた再現UIです。

## 取得状況メモに残すこと

- 対象Discord URLのsafe label
- 取得できた件数
- 最初と最後のコメント時刻
- 画像・添付の件数
- 未取得範囲
- blocked / partial の理由
