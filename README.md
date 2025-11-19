# Social Growth Watcher

YouTube / TikTok / Instagram のチャンネルデータを横断し、直近で伸びている新星アカウントを確認できる統計ダッシュボードです。Next.js (App Router) + Tailwind CSS で構築され、Vercel へそのままデプロイできます。

## 主な特徴
- フィルターバーでプラットフォーム / 期間 / 指標を切り替え可能
- API から取得したチャンネルをテーブル表示し、任意の列で昇順・降順ソート
- 「更新」ボタンもしくはプルダウン変更で最新データを再取得
- 総登録者数が 10 万人以下のチャンネルのみ表示
- Next.js の API Routes (`/app/api/channels`) がモックデータを返却

## セットアップ
```bash
npm install
npm run dev
```

`npm run dev` を実行すると [http://localhost:3000](http://localhost:3000) でアプリを確認できます。ビルドは `npm run build`、本番起動は `npm start` を利用してください。

## 環境変数
機密情報が必要な場合は `.env` に定義してください。サンプルは `.env.example` を参照してください。

## Vercel へのデプロイ
Vercel ダッシュボードで本リポジトリをインポートし、Build Command に `npm run build`、Output に `.vercel/output` (デフォルト) を設定すればそのままデプロイできます。追加のビルドステップは不要です。
