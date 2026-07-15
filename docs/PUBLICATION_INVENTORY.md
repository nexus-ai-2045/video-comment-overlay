# 公開棚卸し

最終更新: 2026-07-15

## 結論

public化に向けた土台はかなり揃っています。PR #1はmerge済みです。現在の残りは、PR #2で時間軸デバッグ、ZIP起動保証、更新確認、Chrome拡張導入ガイドをmainへ反映し、main上で `npm run public:check` を再実行することです。GitHub visibility変更は、対象repoと正確な操作を明示した現在会話でのyesがあるまで実行しません。

## できているもの

| 項目 | 状態 | 根拠 |
|---|---|---|
| ライセンス | MIT追加済み | `LICENSE`, `package.json` |
| バージョン管理 | 0.1.0 + Git metadata | `scripts/version-info.mjs`, `version.json`生成 |
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
| 高 | PR #2を作成・レビュー・merge | public化対象はmainの内容になるため |
| 高 | `npm run public:check` をmainで再実行 | PR #2 merge後の最終状態で確認するため |
| 高 | visibility変更の明示承認 | commit historyとfilesがWeb上で見えるため |
| 中 | Chrome拡張の手動読み込み確認 | `chrome://extensions` は自動操作できないため。導入ガイドとスクショは追加済み |
| 中 | READMEのpublic向け最終目視 | MVP/partial/WebM/実データ境界の誤読を避けるため |
| 低 | GitHub About / topicsの整備 | 見つけやすさの改善。visibility変更とは別操作 |

## いまpublicにしない理由

- PR #2の差分がまだmainに入っていない。
- Chrome拡張の3サイト手動読み込み確認が未完了。
- repository visibility変更の対象と操作について、現在会話でpublic化専用のyesをまだ取っていない。

## public化直前の実行順

```powershell
npm run public:check
git status --short --ignored
gh pr list --repo nexus-ai-2045/video-comment-overlay --state open
```

その後、対象repoと正確なvisibility変更コマンドを明示して、現在会話でyesを待つ。
