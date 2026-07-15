# 公開前チェックリスト

最終更新: 2026-07-15

## 現在の結論

まだpublic化はしない。ローカルで試せる匿名デモZIP、Chrome拡張MVP、拡張導入ガイド、更新確認、時間軸デバッグ補助は用意できているが、GitHub repository visibilityをpublicに変えるには未完了項目が残っています。

## 現在できていること

- `npm run verify` が成功する。
- `node scripts/scan-private-markers.mjs dist/public-demo` が成功する。
- 匿名デモZIPを生成できる。
- Chrome拡張MVPを検証し、ZIP化できる。
- ZIP展開後、`start-windows.bat` / `start-mac-linux.sh` で一時HTTPサーバーを起動して試せる。
- アプリ内の `更新確認` でGitHub Releases latestを確認できる。
- Chrome拡張導入ガイドとスクショを同梱できる。
- `npm run validate:timeline` でコメント本文を出さずに時間軸を検査できる。
- 実Discordログ、実URL、実ID、参加者名、avatar URL、添付をrepoに含めない境界を文書化している。
- 敵対レビューを [docs/ADVERSARIAL_REVIEW.md](docs/ADVERSARIAL_REVIEW.md) に置いている。

## public化までに必要なこと

| 項目 | 状態 | 必要な対応 |
|---|---|---|
| PR #1 | merge済み | 完了 |
| PR #2 | 未作成 | 時間軸デバッグ、ZIP起動保証、更新確認、導入ガイドをレビューしてmergeする |
| README | 更新済み / 要目視 | public向けに「MVP」「visible-partial」「WebM」「一時HTTPサーバー」の注意を最終確認する |
| SECURITY.md | 追加済み | public化後の連絡先やSecurity Advisories運用を決める |
| LICENSE | MIT追加済み | public化前に内容を目視確認する |
| secret scan | ローカル一部OK | `npm run scan:private` と配布ZIP scanを再実行する |
| personal path scan | ローカル一部OK | ローカルユーザーパスや個人名義がsource archiveにないことを再確認する |
| Chrome拡張実機 | 部分OK | 導入ガイドとスクショは追加済み。Discord / YouTube Live / Twitchで手動確認する |
| GitHub visibility | 未実施 | 対象repo、正確な操作、見える範囲を明示してyesを待つ |

## 公開前に実行するコマンド

```powershell
npm run verify
node scripts/scan-private-markers.mjs dist/public-demo
npm run build:extension-zip
npm run public:check
git status --short --ignored
```

必要に応じてsource archive相当のスキャンも行います。

## visibility変更前の確認文

public化する場合は、次を明示してから現在会話でyesを待つ。

- 対象repository: `nexus-ai-2045/video-comment-overlay`
- 正確な操作: `gh repo edit nexus-ai-2045/video-comment-overlay --visibility public`
- README、LICENSE、SECURITY.md、PUBLIC_READY.md、CHANGELOG.md、secret scan、personal path scanの確認状況
- commit historyとfilesがWeb上で見えるようになること

この確認なしにpublic化しない。
