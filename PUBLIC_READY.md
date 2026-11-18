# 公開後の残チェックリスト

最終更新: 2026-10-02

## 現在の結論

GitHub repository はすでに public です。visibility 変更は不要です。ローカルで試せる匿名デモZIP、Chrome拡張MVP、拡張導入ガイド、更新確認、時間軸デバッグ補助は用意できています。残りは人間による残確認（Chrome拡張の手動確認、Release パッケージング、文書の目視）です。

## 現在できていること

- `npm run verify` が成功する。
- markerを設定した状態で `node scripts/scan-private-markers.mjs dist/public-demo` が成功する（markerが未設定だとscanはskipされ `WARNING: private marker scan skipped` を表示して成功扱いになる。実際の共有前確認では `.private-markers.txt` か `PRIVATE_MARKERS` でmarkerを設定し、`PRIVATE_MARKERS_REQUIRED=1` を付けて実行する）。
- 匿名デモZIPを生成できる。
- Chrome拡張MVPを検証し、ZIP化できる。
- ZIP展開後、`start-windows.bat` / `start-mac-linux.sh` で一時HTTPサーバーを起動して試せる。
- アプリ内の `更新確認` でGitHub Releases latestを確認できる。
- Chrome拡張導入ガイドとスクショを同梱できる。
- `npm run validate:timeline` でコメント本文を出さずに時間軸を検査できる。
- 実Discordログ、実URL、実ID、参加者名、avatar URL、添付をrepoに含めない境界を文書化している。
- 敵対レビューを [docs/ADVERSARIAL_REVIEW.md](docs/ADVERSARIAL_REVIEW.md) に置いている。
- GitHub repository visibility は public（実施済み）。

## public化後に残っていること

| 項目 | 状態 | 必要な対応 |
|---|---|---|
| PR #1 | merge済み | 完了 |
| PR #2 | merge済み | 完了 |
| PR #3 | merge済み | 完了 |
| README | 更新済み / 要目視 | public向けに「MVP」「visible-partial」「WebM」「一時HTTPサーバー」の注意を最終確認する |
| SECURITY.md | 追加済み | Security Advisories運用や連絡先を必要に応じて決める |
| LICENSE | MIT追加済み | 内容を目視確認する |
| secret scan | ローカル一部OK | `.private-markers.txt` か `PRIVATE_MARKERS` でmarkerを設定したうえで `PRIVATE_MARKERS_REQUIRED=1 npm run scan:private` と配布ZIP scanを再実行する (未設定だとscanはskipされる) |
| personal path scan | ローカル一部OK | ローカルユーザーパスや個人名義がsource archiveにないことを再確認する |
| Chrome拡張実機 | 部分OK | 導入ガイドとスクショは追加済み。Discord / YouTube Live / Twitchで手動確認する |
| GitHub visibility | 実施済み | public。これ以上の変更はしない |
| GitHub Release | 未実施 | 人間承認後に `v0.1.1` と配布ZIPを作る（この文書だけでは作成しない） |

## 残確認で実行するコマンド

```powershell
$env:PRIVATE_MARKERS_REQUIRED = "1"   # marker未設定ならskipではなく失敗させる
npm run verify
node scripts/scan-private-markers.mjs dist/public-demo
npm run build:extension-zip
npm run public:check
git status --short --ignored
```

private marker scanは `.private-markers.txt` (repo直下、gitignore済み) か環境変数 `PRIVATE_MARKERS` のmarkerを使います。markerが未設定の場合は `WARNING: private marker scan skipped` を表示してexit 0になり、実際の検査は行われません。共有前の確認ではmarkerを設定し、`PRIVATE_MARKERS_REQUIRED=1` で実行してください。詳しくはREADMEの「private marker scan」を参照してください。

必要に応じてsource archive相当のスキャンも行います。

## 人間承認が必要な残作業

次は visibility 変更ではなく、追加の人間承認が必要な残作業です。

- Chrome拡張を Discord / YouTube Live / Twitch の3サイトで手動確認する
- README、LICENSE、SECURITY.md、PUBLIC_READY.md、CHANGELOG.md の最終目視
- 必要なら GitHub Release `v0.1.1` と配布ZIPを作る（対象・操作を明示した現在会話のyesがあるまで作成しない）
- 追加のデプロイ、SNS投稿、デモURL発行（同様に明示承認が必要）
