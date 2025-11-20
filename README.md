# Social Growth Watcher

YouTube / TikTok / Instagram のチャンネルデータを横断し、直近で伸びている新星アカウントを確認できる統計ダッシュボードです。Next.js (App Router) + Tailwind CSS で構築され、Vercel へそのままデプロイできます。

## 主な特徴
- フィルターバーでプラットフォーム / 期間 / 指標を切り替え可能
- API から取得したチャンネルをテーブル表示し、任意の列で昇順・降順ソート
- 「更新」ボタンもしくはプルダウン変更で最新データを再取得
- 総登録者数が 10 万人以下のチャンネルのみ表示
- Next.js の API Routes (`/app/api/channels`) がモックデータを返却
- スクレイピング + 公式 API フォールバックでチャンネル URL とプロフィールアイコンを正規化し、404 を回避

## セットアップ
```bash
npm install
npm run dev
```

`npm run dev` を実行すると [http://localhost:3000](http://localhost:3000) でアプリを確認できます。ビルドは `npm run build`、本番起動は `npm start` を利用してください。

## 環境変数
チャンネルURLとプロフィール画像の正規化ではスクレイピング → API フォールバック方式を採用しており、以下のキーを `.env` に設定することで公式URLやアイコンを取得できます。

| 変数名 | 用途 |
| --- | --- |
| `YOUTUBE_API_KEY` | YouTube Data API v3 から canonical URL を取得 |
| `TIKTOK_API_KEY` / `TIKTOK_API_HOST` / `TIKTOK_API_ENDPOINT` | RapidAPI などで提供される TikTok ユーザー情報 API へ接続 |
| `INSTAGRAM_GRAPH_API_TOKEN` | Meta Graph API (instagram_oembed) 呼び出し用トークン |

`.env.example` にも同名のプレースホルダーを用意しているので、コピーして値を入力してください。

## Vercel へのデプロイ
Vercel ダッシュボードで本リポジトリをインポートし、Build Command に `npm run build`、Output に `.vercel/output` (デフォルト) を設定すればそのままデプロイできます。追加のビルドステップは不要です。
