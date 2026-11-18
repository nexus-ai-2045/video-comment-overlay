# 動画ソースと保存方針

最終更新: 2026-07-16

## 結論

`video-comment-overlay` は、外部サービスから動画を抜き出すツールではなく、ユーザーが用意した動画・録画ファイルとコメントJSONを同期して、配信画面として再現・録画するローカルファーストな編集ツールとして扱う。

動画は「DLする」より「権利ある素材を持ち込む」。コメントは「取得できた範囲を正直に保存する」。出力はブラウザ録画と相性の良い `WebM` を基本にし、必要な人に `MP4` 変換導線を用意する。

見やすい説明版は [VIDEO_SOURCE_POLICY.html](VIDEO_SOURCE_POLICY.html) を参照。

## サービス別方針

| サービス | 動画の扱い | コメントの扱い | UIでの見せ方 |
|---|---|---|---|
| YouTube | URL埋め込み再生を中心にする。汎用動画DLは入れない | エクスポート済みJSONや今後の取得アダプタ候補 | `YouTube URLで再生` |
| Twitch | 自分のVOD/Clipを公式DLしたファイル、またはOBS録画を読み込む | TwitchチャットJSONや表示DOM取得を候補にする | `VODファイルを選ぶ` |
| Discord | Go Live / 画面共有は公式アーカイブDL前提ではない。OBS等で録画した動画を読み込む | Chrome拡張で表示済みDOMを取得する | `録画ファイル + コメントJSON` |
| ローカル動画 | 最優先の入力。権利、保存場所、再現性が明確 | 保存済みJSONと同期する | `動画ファイルを選ぶ` |

## 実装に入れるもの

- ローカル動画ファイルの読み込み。
- YouTube URLの埋め込み再生。
- Discord / YouTube Live / Twitch風の再現テンプレート。
- Discord / YouTube Live / Twitchコメントの保存済みJSON読み込み。
- Chrome拡張による、表示中コメントDOMのユーザー操作取得。
- 取得結果の保存前プレビューと範囲選択。
- ブラウザ標準の `MediaRecorder` による `WebM` 録画。
- `WebM` から `MP4` へ変換するための案内、または将来のローカル変換導線。

## 実装に入れないもの

- YouTube公開動画の汎用DLボタン。
- Twitch第三者VOD / Liveの汎用DLボタン。
- Discord Go Live / 画面共有のキャッシュ抽出。
- cookie、token、browser profile、localStorageの抜き出し。
- 取得できていないコメントや動画を取得済みとして扱うこと。

## Discord配信の扱い

Discordのボイスチャンネル画面共有やGo Liveは、後から動画ファイルとして公式DLできる前提ではない。端末内に一時的なバッファやキャッシュが残る可能性はあるが、動画素材として取り出す設計にはしない。

保存したい場合は、視聴中にOBS Studio、Windows標準録画、ShareXなどで録画する。一般用途ではOBS Studioが最も安定しやすい。OBSはOSSだが、このrepoにOBSを組み込むのではなく、外部録画手段として案内する。

## WebMとMP4変換

このツールの録画保存形式は `WebM` を基本にする。理由は、ブラウザ標準の `MediaRecorder` と相性がよく、Chrome / Edge系で安定しやすいため。

一方で、動画編集ソフト、納品先、投稿先によっては `MP4` が必要になる。初期方針としては、アプリ内に重い変換エンジンを抱え込まず、まずは `ffmpeg` やHandBrakeによる変換手順を案内する。

例:

```bash
ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4
```

Electron版やローカル同梱版を作る段階では、`ffmpeg` を呼び出す変換ボタンを検討する。

## ユーザーの作業フロー

1. 動画を用意する。
   - ローカル動画、OBS録画、Twitch公式DL済みVOD、またはYouTube URLを使う。
2. コメントを用意する。
   - JSONを読み込む。DiscordはChrome拡張で表示中DOMを取得する。
3. 表示を選ぶ。
   - Discord風、Twitch風、YouTube風、LINE風、ニコ動方式を切り替える。
4. 同期を調整する。
   - 動画開始時刻、コメント範囲、表示密度、色、速度を調整する。
5. 保存する。
   - 合成結果を `WebM` で録画し、必要に応じて `MP4` に変換する。

## UI設計メモ

トップは説明ページではなく、作業台にする。

```text
[動画ソース]  YouTube URL / ローカル動画 / 録画WebM
[コメント]    JSONを読み込み / Chrome拡張で取得
[再現モード]  Discord / Twitch / YouTube / ニコ動 / LINE
[プレビュー]  動画 + コメント overlay
[出力]        WebM録画 / MP4変換案内
```

ユーザー向けの短い文言は次を使う。

- 動画は外部サービスから自動DLしません。
- Discord配信はOBS等で録画した動画を使います。
- Twitchは自分の公式DL済みVOD/Clipを読み込めます。
- 録画はWebMで保存されます。必要に応じてMP4へ変換できます。

## 公開境界

この方針は、動画やコメントの取得に関する安全側の設計判断であり、GitHub repository visibility変更、release、外部告知、広範な共有の承認ではない。公開前にはREADME、license、SECURITY.md、secret scan、personal path scan、生成ZIPの目視確認を別途行う。
