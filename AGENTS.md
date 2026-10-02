# video-comment-overlay 作業ルール

## 公開境界

このリポジトリは GitHub 上ですでに public です。visibility 変更は行いません。

現在会話で対象と操作を明示した人間レビューと承認がない限り、追加のデプロイ、外部共有、SNS投稿、デモURL発行、Release作成を行いません。

## データ境界

- `data/thread-comments.json` は private データとして扱います。
- Discord由来の本文、実URL、実ID、参加者名、avatar URL、添付URLは外部共有物へ入れません。
- 共有候補は `npm run build:public-demo` で生成する `dist/public-demo/` を使います。
- `dist/public-demo/` も、人間レビュー前に外へ出しません。

## 実装方針

- 静的HTML/CSS/JSで動く状態を保ちます。
- YouTube同期は iframe API が使える時だけ有効にし、使えない時はコメントタイマーで代替します。
- デザインプリセット、コメント編集、シークバーはローカル状態で完結させます。
