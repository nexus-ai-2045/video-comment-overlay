# 公開棚卸し

最終更新: 2026-10-02

## 結論

GitHub repository はすでに public です。PR #1、PR #2、PR #3はmerge済みで、main上の `npm run public:check` は成功しています。現在の残りは人間による残確認です。Chrome拡張の3サイト手動確認、文書の目視、必要なら Release パッケージングです。visibility 変更は不要で、行いません。

## できているもの

| 項目 | 状態 | 根拠 |
|---|---|---|
| ライセンス | MIT追加済み | `LICENSE`, `package.json` |
| バージョン管理 | 0.1.1 + Git metadata | `scripts/version-info.mjs`, `version.json`生成 |
| 変更履歴 | 追加済み | `CHANGELOG.md` |
| セキュリティ方針 | 追加済み | `SECURITY.md` |
| 公開チェック | 追加済み | `PUBLIC_READY.md`, `npm run public:check` |
| 匿名デモZIP | 生成可能 | `npm run build:public-zip` |
| Chrome拡張ZIP | 生成可能 | `npm run build:extension-zip` |
| privateデータ境界 | 文書化済み | `SHARE_REVIEW.md`, `docs/DATA_HANDOFF.md` |
| 敵対レビュー | 文書化済み | `docs/ADVERSARIAL_REVIEW.md` |
| Chrome拡張導入ガイド | 追加済み | `docs/CHROME_EXTENSION_INSTALL.md`, `docs/assets/extension-install/` |
| ZIP起動保証 | 追加済み | `start-windows.bat`, `start-mac-linux.sh`, `README-public-demo.md` |
| 更新確認 | 追加済み | GitHub Releases latest確認ボタン |
| GitHub visibility | 実施済み | public |

## public化後に残るもの

| 優先度 | 残り | 理由 |
|---|---|---|
| 高 | Chrome拡張をDiscord / YouTube Live / Twitchの3サイトで手動確認 | 利用者が最初につまずく箇所のため |
| 高 | README、LICENSE、SECURITY.md、PUBLIC_READY.md、CHANGELOG.mdの最終目視 | 外から見える文書のため |
| 中 | 必要なら GitHub Release `v0.1.1` と配布ZIPを作る | アプリ内更新確認の導線になるため。人間承認後のみ |
| 低 | GitHub About / topicsの整備 | 見つけやすさの改善。visibilityとは別操作 |

## いま残っている理由

- Chrome拡張の3サイト手動読み込み確認が未完了。
- Release作成や追加の外部共有は、対象と操作を明示した現在会話のyesがあるまで行わない。

## 残確認の実行順

```powershell
npm run public:check
git status --short --ignored
gh pr list --repo nexus-ai-2045/video-comment-overlay --state open
```

Release作成や追加のデプロイ・SNS投稿・デモURL発行は、対象と操作を明示して現在会話でyesを待つ。visibility 変更は行わない。
