# video-comment-overlay

動画や配信コメントのローカルデータを読み込み、合成素材用の再生画面を作るローカルファーストな静的ツールです。

## 何ができるか

- YouTube URL またはローカル動画を読み込む
- コメントJSON / Discord raw NDJSON を読み込む
- LINE風、ニコ動方式、Discord風、字幕風の表示を切り替える
- Discord / YouTube Live / Twitch風の再現ビューで、コメントの流れだけを再生する
- 前面の配信元切替で、Discord / YouTube Live / Twitchの取込先と再現テンプレを切り替える
- 保存済みのDiscord / YouTube Live / TwitchコメントJSONを共通形式へ正規化して読み込む
- YouTube風の下部シークバーでコメントタイムラインを操作する
- ブラウザの画面共有録画を使い、HD / Full HD / QHD品質のWebMとして保存する
- 表示位置、テーマ、文字サイズ、吹き出し幅、レーン数、同時表示数を調整する
- プリセットを保存、読み込み、JSON書き出しする
- コメント一覧から時刻、表示名、本文、非表示を編集する
- YouTube iframe API が使える場合は動画の再生、停止、シークに同期する
- 共有前レビュー用の匿名デモパッケージを生成する
- Chrome拡張MVPで、表示中のDiscord / YouTube Live / TwitchコメントをJSON保存する
- ZIPを展開し、Windows / macOS / Linuxの起動スクリプトでローカル実行する
- GitHub Releasesを使って新しい配布版の有無を確認する

## すぐ試す

ZIPで受け取った場合:

1. `video-comment-overlay-public-demo.zip` を展開します。
2. `index.html` をブラウザで開きます。
3. ブラウザのローカルファイル制限に当たる場合は、展開フォルダ内の `start-windows.bat` を実行し、`http://127.0.0.1:8765/` を開きます。

ローカル開発環境では `data/thread-comments.json` が存在すると自動で読み込みます。これは検証用のprivateデータ置き場で、repoや配布ZIPには含めません。受け取った人は、前面の `ファイル取込` または設定内の `コメントJSON` から別渡しJSONを読み込みます。

ソースから起動する場合:

```powershell
npm run start
```

既定では `http://127.0.0.1:8765/` で開きます。

配布ZIPには `start-windows.bat` と `start-mac-linux.sh` を含めます。ブラウザで直接 `index.html` を開けない場合でも、ZIPを展開したフォルダで起動スクリプトを実行すればローカルサーバーで開けます。

起動スクリプトは、展開したフォルダを `http://127.0.0.1:8765/` で読むための一時HTTPサーバーを立ち上げます。これは自分のPC内で開くローカルサーバーで、インターネットへ公開するサーバーではありません。終了する時は、起動スクリプトを実行したターミナルを閉じるか、`Ctrl+C` で停止します。既に8765番ポートを使っているアプリがある場合は起動に失敗することがあります。

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

`time` は動画開始からの秒数です。Discord raw NDJSONを読み込む場合は、画面上の「動画開始日時」を指定すると、Discordの `timestamp` との差分でタイムライン化します。Chrome拡張MVPのように `timeline.commentTimeMode` が `relative-visible-order` や `timestamp-diff` のJSONでは、画面上の「動画開始日時」を指定してから読み込むと、保存済みの表示順 `time` より `timestamp` 差分を優先して再計算します。

## 配信画面再現と録画

「画面モード」で `Discord再現`、`YouTube Live再現`、`Twitch再現` を選ぶと、動画面の代わりに各サービス風のチャット再現画面を表示します。コメント再生、シーク、コメント一覧編集は通常の動画オーバーレイと同じタイムラインで動きます。

この再現ビューは、各サービスのHTMLを丸ごと同梱したものではありません。ローカルツールとして扱いやすいように、チャット欄、配信画面、サイドバー、入力欄の構造と密度を参考にしたテンプレートです。

録画はブラウザ標準の画面共有を使います。録画品質、fps、bitrate、codecを調整できます。

1. `Discord再現`、`YouTube Live再現`、`Twitch再現` のいずれかを選びます。
2. 必要に応じて `録画品質`、`fps`、`bitrate Mbps`、`codec` を選びます。
3. `録画診断` でブラウザの録画対応とcodecを確認します。
4. `画面録画開始` を押します。
5. ブラウザの共有選択で、このタブまたはウィンドウを選びます。
6. コメントを再生し、必要なところで `録画停止` を押します。
7. `WebM保存` で動画ファイルを書き出します。

録画データはローカルブラウザ内で作られます。アプリ側から外部送信はしません。

`WebM` はWeb向けのオープンな動画コンテナ形式です。ブラウザの画面録画APIでは扱いやすい形式ですが、編集ソフトや納品先によってはMP4変換が必要になることがあります。このツールではまずブラウザ内で安定して録画しやすいWebMを出力し、必要に応じて編集側でMP4へ変換する前提です。

| 設定 | 目安 |
|---|---|
| `HD 720p` | 軽い確認用 |
| `Full HD 1080p` | YouTube素材の標準候補 |
| `QHD 1440p` | 文字の輪郭を残したい場合 |
| `30fps` | 通常のチャット再現 |
| `60fps` | スクロールや弾幕の滑らかさ優先 |
| `12Mbps` | Full HDの初期値 |
| `20Mbps` 以上 | QHDや細かい文字の保持優先 |

実際の録画解像度は、ブラウザの画面共有で選んだタブ、ウィンドウ、ディスプレイの実サイズにも左右されます。録画開始後のステータスに、ブラウザから返ってきた実キャプチャ解像度とfpsを表示します。

## 配信単位のコメント取得

このrepoに含むアプリ本体は、まず「ローカルに保存済みのコメントデータを読み込んで再生・録画する」ことを中心にしています。配信URLから自動取得する機能は、サービスごとの認証、API、利用規約、保存形式が違うため、アダプタとして分けて育てる想定です。

前面の `URLから取込` は、直接読めるJSON / NDJSON URLには対応します。YouTube Live、Twitch、Discordの通常の配信ページURLから履歴を直接取得する処理は、今後のサービス別アダプタ対象です。CORSや認証で取れない場合は、保存済みJSONを `ファイル取込` してください。

一般ユーザーが自分のブラウザで開いているDiscord / YouTube Live / Twitchからコメントを取得する口は、Chrome拡張としてviewer本体から分ける方針です。viewer本体はローカルJSONの再生・調整・録画に集中し、取得拡張はユーザー操作で対象タブから読み取り、`video_comment_overlay.v1` JSONとprivate manifestを書き出します。詳細は [docs/CAPTURE_EXTENSION_PLAN.md](docs/CAPTURE_EXTENSION_PLAN.md) を参照してください。

初期MVPは [extensions/chrome-capture](extensions/chrome-capture) にあります。これは表示中DOMから見えている範囲だけを取得するため、出力は `visible-partial` として扱います。保存前に取得結果の件数、先頭/末尾の時刻、プレビューを確認し、保存開始/終了番号を選んでからJSON保存します。導入手順は [docs/CHROME_EXTENSION_INSTALL.md](docs/CHROME_EXTENSION_INSTALL.md) にまとめています。

初期対象:

| サービス | 入力候補 | 状態 |
|---|---|---|
| Discord Live / Discord channel | Discord raw NDJSON / 正規化JSON | 読み込み対応済み |
| YouTube Live | エクスポート済みチャットJSON / 今後の取得アダプタ | テンプレ再現対応 |
| Twitch | VOD chat JSON / 今後の取得アダプタ | テンプレ再現対応 |

実ログや取得済みコメント、画像、添付はrepoには含めません。配信単位で取得したデータは、別渡しのJSONやZIPとして扱います。

## よく使うコマンド

```powershell
npm run version:json
npm run check
npm run check:extension
npm run validate:timeline -- path\to\comments.json --video-start 2026-07-14T21:00:00+09:00
npm run verify
npm run build:extension-zip
npm run build:public-zip
npm run public:check
```

| コマンド | 用途 |
|---|---|
| `npm run version:json` | package version、Git commit、branch、dirty状態をJSONで表示 |
| `npm run check` | JavaScript構文チェック |
| `npm run check:extension` | Chrome拡張MVPの権限と禁止APIを確認 |
| `npm run validate:timeline -- path\to\comments.json` | コメント本文を出さずに件数、timestamp解析率、time範囲、開始日時ズレを確認 |
| `npm run build:extension-zip` | Chrome拡張MVPのZIPを生成 |
| `npm run build:public-zip` | 匿名デモの `dist/public-demo/` とZIPを生成 |
| `npm run verify` | 構文、ZIP生成、private marker scanをまとめて実行 |
| `npm run public:check` | public化前のローカル確認をまとめて実行 |

## データ境界

`data/` 配下のコメントデータはrepoに含めません。Discord由来の本文、参加者名、avatar URL、実URL、画像、添付、テスト用コメントJSONは別ファイルとして渡します。

共有前レビュー用には匿名化デモを生成します。

```powershell
npm run build:public-zip
```

生成先:

`dist/public-demo/`

`dist/video-comment-overlay-public-demo.zip`

Chrome拡張だけを渡す場合:

```powershell
npm run build:extension-zip
```

生成先:

`dist/video-comment-overlay-chrome-capture.zip`

ZIPは匿名デモデータだけを同梱します。展開後は `index.html` を開けば試せます。ブラウザのローカルファイル制限に当たる場合は、同梱の `start-windows.bat` または `start-mac-linux.sh` でローカルサーバーを起動します。

GitHubのsource ZIPにも private データやテストデータは含めない前提です。取得済みログを使った検証は、ローカルにだけ置いた `data/thread-comments.json` で行います。

別渡しデータの作り方と受け渡し方は [docs/DATA_HANDOFF.md](docs/DATA_HANDOFF.md) を参照してください。

アプリ右上の `更新確認` は、GitHub Releasesの最新リリースを見に行きます。新しい版がある場合はリリースページを開きます。repoがprivateの間、またはRelease未作成の間は、更新情報なしとして扱います。

詳しくは [SHARE_REVIEW.md](SHARE_REVIEW.md) を参照してください。

## バージョン管理

アプリの表示バージョンはGitから自動生成します。初期public-ready MVPのパッケージバージョンは `0.1.0` です。

- 通常のソース起動では `src/version.js` の静的フォールバックを表示します。
- `npm run build:public-zip` では、その時点のGit commit / branch / dirty状態を `dist/public-demo/version.json` とHTML内の `window.VCO_VERSION` に埋め込みます。
- 手動で `package.json` の `version` を上げるのは、リリース単位を切る時だけにします。
- 変更履歴は [CHANGELOG.md](CHANGELOG.md) に残します。

## ライセンス

MIT Licenseです。詳細は [LICENSE](LICENSE) を参照してください。

## Git運用

このrepoにはGitHub ActionsやGit hooksを含めません。必要な確認は手元で明示的に実行します。

変更前後のローカル推奨:

```powershell
npm run verify
git status --short
```

## 取得状況

実Discordログの取得状況はローカルprivateデータとして扱います。repoと配布ZIPには、実URL、実ID、実参加者名、元本文、avatar URL、添付を含めません。

## 公開境界

このリポジトリは private 前提です。公開、外部共有、デプロイ、GitHub visibility 変更は、人間レビューと現在会話での明示承認なしに行いません。
