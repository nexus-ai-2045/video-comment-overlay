# 公開棚卸し

最終更新: 2026-07-15

## 結論

public化に向けた土台はかなり揃っています。PR #1、PR #2、PR #3はmerge済みで、main上の `npm run public:check` は成功しています。現在の残りは、Chrome拡張の3サイト手動確認、公開前の人間目視、GitHub visibility変更の明示承認です。GitHub visibility変更は、対象repoと正確な操作を明示した現在会話でのyesがあるまで実行しません。

## できているもの

| 項目 | 状態 | 根拠 |
|---|---|---|
| ライセンス | MIT追加済み | `LICENSE`, `package.json` |
| バージョン管理 | 0.1.1 + Git metadata | `scripts/version-info.mjs`, `version.json`生成 |
| 変更履歴 | 追加済み | `CHANGELOG.md` |
| セキュリティ方針 | 追加済み | `SECURITY.md` |
| 公開前チェック | 追加済み | `PUBLIC_READY.md`, `npm run public:check` |
| 匿名デモZIP | 生成可能 | `npm run build:public-zip` |
| Chrome拡張ZIP | 生成可能 | `npm run build:extension-zip` |
| privateデータ境界 | 文書化済み | `SHARE_REVIEW.md`, `docs/DATA_HANDOFF.md` |
| 敵対レビュー | 文書化済み | `docs/ADVERSARIAL_REVIEW.md` |
| Chrome拡張導入ガイド | 追加済み | `docs/CHROME_EXTENSION_INSTALL.md`, `docs/assets/extension-install/` |
| ZIP起動保証 | 追加済み | `start-windows.bat`, `start-mac-linux.sh`, `README-public-demo.md` |
| 更新確認 | 追加済み | GitHub Releases latest確認ボタン |

## public化までに残るもの

| 優先度 | 残り | 理由 |
|---|---|---|
| 高 | Chrome拡張をDiscord / YouTube Live / Twitchの3サイトで手動確認 | public化後に利用者が最初につまずく箇所のため |
| 高 | README、LICENSE、SECURITY.md、PUBLIC_READY.md、CHANGELOG.mdの最終目視 | public化後に外から見えるため |
| 高 | source filesとcommit historyがWeb上に見えることの人間確認 | visibility変更で履歴も公開されるため |
| 高 | visibility変更の明示承認 | commit historyとfilesがWeb上で見えるため |
| 中 | public化後にGitHub Release `v0.1.1` と配布ZIPを作る | アプリ内更新確認の導線になるため |
| 低 | GitHub About / topicsの整備 | 見つけやすさの改善。visibility変更とは別操作 |

## いまpublicにしない理由

- Chrome拡張の3サイト手動読み込み確認が未完了。
- repository visibility変更の対象と操作について、現在会話でpublic化専用のyesをまだ取っていない。

## public化直前の実行順

```powershell
npm run public:check
git status --short --ignored
gh pr list --repo nexus-ai-2045/video-comment-overlay --state open
```

その後、対象repoと正確なvisibility変更コマンドを明示して、現在会話でyesを待つ。
