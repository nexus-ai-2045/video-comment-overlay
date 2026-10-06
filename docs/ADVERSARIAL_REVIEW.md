# 敵対レビュー

最終更新: 2026-07-15

## 対象

- viewer本体の再現画面、録画、コメント読込。
- Chrome拡張MVPの表示中コメント取得。
- 匿名デモZIPとGitHub source ZIPに混ざる情報。

## レビュー結論

現時点の最重要リスクは「完全取得に見えてしまうこと」と「取得拡張が認証情報に触れるように膨らむこと」です。そのため、Chrome拡張MVPは `visible-partial` として明示し、Cookieやtoken、browser profile、storage内容を読まない実装に限定します。

## 攻撃・事故シナリオ

| シナリオ | 影響 | 対応 |
|---|---|---|
| 表示中DOM取得を完全履歴と誤解する | 欠落したコメントを動画に使ってしまう | `coverage: visible-partial` とmanifest blockerを出す |
| 実Discord URLや実IDがrepoに混ざる | 外部共有時にprivate情報が漏れる | `scan:private` と別渡しデータ境界を維持 |
| 拡張がcookieやtokenを読む | 重大な認証情報漏えい | Manifestにcookies権限を入れず、コードでもcookie/storageを読まない |
| 取得結果を外部送信する | コメント本文や参加者名が漏れる | `downloads` によるローカル保存だけにする |
| 配信サービスのDOM変更で取得不能になる | ユーザーが空JSONを作る | 件数0のとき保存ボタンを無効化し、blocked理由を出す |
| YouTube/Twitch/Discord風画面が本物HTML同梱に見える | 権利・保守・誤認リスク | HTML丸ごと保存ではなく、合成素材用の再現UIとして明記 |

## 追加したガード

- `scripts/scan-private-markers.mjs` に、旧アカウント名や短い個人識別子の混入検出を追加。
- Chrome拡張の権限を `activeTab`, `scripting`, `downloads`, `storage` と対象hostだけに限定。
- Chrome拡張コードで `document.cookie`, `localStorage`, `sessionStorage`, `chrome.cookies` を使わない。
- 取得データは `coverage: visible-partial` として出力。

## 次の敵対レビュー観点

- 実Chromeで拡張を読み込み、各サービスの実DOMでセレクタが空振りしないか確認する。
- 拡張の出力JSONをviewerへ読み込ませ、時刻順、表示名、本文、avatar欠損時の表示を確認する。
- 完全取得が必要な場合は、ブラウザ拡張ではなく、サービス別API/エクスポート/ユーザー提供データの別経路として扱う。
