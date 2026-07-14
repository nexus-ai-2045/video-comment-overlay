# 公開棚卸し

最終更新: 2026-07-15

## 結論

public化に向けた土台はかなり揃っています。残っている主要判断は、PR #1のmerge、GitHub visibility変更の明示承認、Chrome拡張の手動実機読み込み確認です。

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

## public化までに残るもの

| 優先度 | 残り | 理由 |
|---|---|---|
| 高 | PR #1をmergeしてmainを最新化 | public化対象はmainの内容になるため |
| 高 | `npm run public:check` をmainで再実行 | PR merge後の最終状態で確認するため |
| 高 | visibility変更の明示承認 | commit historyとfilesがWeb上で見えるため |
| 中 | Chrome拡張の手動読み込み確認 | `chrome://extensions` は自動操作できないため |
| 中 | READMEのpublic向け最終目視 | MVP/partial/WebM/実データ境界の誤読を避けるため |
| 低 | GitHub About / topicsの整備 | 見つけやすさの改善。visibility変更とは別操作 |

## いまpublicにしない理由

- PR #1がまだmergeされていない。
- Chrome拡張の手動読み込み確認が未実施。
- repository visibility変更の対象と操作について、現在会話でpublic化専用のyesをまだ取っていない。

## public化直前の実行順

```powershell
npm run public:check
git status --short --ignored
gh pr view 1 --repo nexus-ai-2045/video-comment-overlay --json state,mergeable
```

その後、対象repoと正確なvisibility変更コマンドを明示して、現在会話でyesを待つ。
