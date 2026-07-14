# video-comment-overlay

動画の上に、Discord / LINE / ニコ動風のコメントを同期表示するローカルファーストな静的ビューアです。

## 何ができるか

- YouTube URL またはローカル動画を読み込む
- コメントJSON / Discord raw NDJSON を読み込む
- LINE風、ニコ動方式、Discord風、字幕風の表示を切り替える
- YouTube風の下部シークバーでコメントタイムラインを操作する
- 表示位置、テーマ、文字サイズ、吹き出し幅、レーン数、同時表示数を調整する
- プリセットを保存、読み込み、JSON書き出しする
- コメント一覧から時刻、表示名、本文、非表示を編集する
- YouTube iframe API が使える場合は動画の再生、停止、シークに同期する
- 共有前レビュー用の匿名デモパッケージを生成する

## すぐ試す

ZIPで受け取った場合:

1. `video-comment-overlay-public-demo.zip` を展開します。
2. `index.html` をブラウザで開きます。
3. ブラウザのローカルファイル制限に当たる場合は、展開フォルダ内の `start-windows.bat` を実行し、`http://127.0.0.1:8765/` を開きます。

ソースから起動する場合:

```powershell
npm run start
```

既定では `http://127.0.0.1:8765/` で開きます。

## コメントJSON形式

最小例:

```json
{
  "schema": "video_comment_overlay.v1",
  "timeline": {
    "videoStartAt": "2026-01-01T00:00:00+09:00",
    "commentTimeMode": "absolute"
  },
  "participants": {
    "demo-user-1": {
      "name": "参加者A",
      "color": "#2f80ed",
      "avatarUrl": ""
    }
  },
  "comments": [
    {
      "id": "demo-comment-1",
      "authorId": "demo-user-1",
      "authorName": "参加者A",
      "time": 1,
      "text": "1秒目に表示するコメント"
    }
  ]
}
```

`time` は動画開始からの秒数です。Discord raw NDJSONを読み込む場合は、画面上の「動画開始日時」を指定すると、Discordの `timestamp` との差分でタイムライン化します。

## よく使うコマンド

```powershell
npm run version:json
npm run check
npm test
npm run verify
npm run build:public-zip
```

| コマンド | 用途 |
|---|---|
| `npm run version:json` | package version、Git commit、branch、dirty状態をJSONで表示 |
| `npm run check` | JavaScript構文チェック |
| `npm test` | Node標準テストランナーでデータ/バージョン契約を確認 |
| `npm run build:public-zip` | 匿名デモの `dist/public-demo/` とZIPを生成 |
| `npm run verify` | 構文、テスト、ZIP生成、private marker scan、source archive検証をまとめて実行 |

任意でローカルGit hookを有効化できます。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-git-hooks.ps1
```

有効化後は `git commit` 前に `npm run check`、`npm test`、`npm run scan:private` が走ります。

## データ境界

`data/thread-comments*.json` と `data/comments.sample.json` は private データです。Discord由来の本文、参加者名、avatar URL、実URLを含むため、Git管理から外し、外部共有しません。

共有前レビュー用には匿名化デモを生成します。

```powershell
npm run build:public-zip
```

生成先:

`dist/public-demo/`

`dist/video-comment-overlay-public-demo.zip`

ZIPは匿名デモデータだけを同梱します。展開後は `index.html` を開けば試せます。ブラウザのローカルファイル制限に当たる場合は、同梱の `start-windows.bat` または `start-mac-linux.sh` でローカルサーバーを起動します。

GitHubのsource ZIPにも private データは含めない前提です。取得済みログを使った検証は、ローカルにだけ置いた `data/thread-comments.json` で行います。

詳しくは [SHARE_REVIEW.md](SHARE_REVIEW.md) を参照してください。

## バージョン管理

アプリの表示バージョンはGitから自動生成します。

- 通常のソース起動では `src/version.js` の静的フォールバックを表示します。
- `npm run build:public-zip` では、その時点のGit commit / branch / dirty状態を `dist/public-demo/version.json` とHTML内の `window.VCO_VERSION` に埋め込みます。
- 手動で `package.json` の `version` を上げるのは、リリース単位を切る時だけにします。

## Git / CI

このリポジトリはGitHub Actionsで `npm run verify` を実行します。

- workflow: `.github/workflows/ci.yml`
- 対象: `main`、`codex/**`、`main` 向けPR
- OS: `windows-latest`

PR前のローカル推奨:

```powershell
npm run verify
git status --short
```

ローカルGit hookを使う場合:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-git-hooks.ps1
```

## 取得状況

実Discordログの取得状況はローカルprivateデータとして扱います。repoと配布ZIPには、実URL、実ID、実参加者名、元本文、avatar URL、添付を含めません。

## 公開境界

このリポジトリは private 前提です。公開、外部共有、デプロイ、GitHub visibility 変更は、人間レビューと現在会話での明示承認なしに行いません。
