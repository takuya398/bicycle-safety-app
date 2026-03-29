# チャリ安全ナビ

自転車の危険地点・注意地点を地図上で共有し、安全な走行を促進するWebアプリです。

## 使用技術

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (Auth / Postgres / RLS)
- **地図**: Mapbox GL JS + Mapbox Geocoding API
- **デプロイ**: Vercel

## 主な機能

- 🗺️ 地図上での危険地点表示・投稿
- 🔔 危険地点接近通知（アプリ起動中）
- 📚 交通ルール学習ページ
- ⭐ 地点の保存・「参考になった」投票
- 🚩 不適切投稿の通報
- 🔐 Google / マジックリンク認証
- 👮 管理者ダッシュボード

---

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR_USERNAME/bicycle-safety-app.git
cd bicycle-safety-app
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各APIキーを入力してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

---

## Supabase設定方法

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. ダッシュボードの **Settings → API** から `URL` と `anon key` を取得
3. `.env.local` に設定
4. **SQL Editor** で `supabase/migrations/001_initial.sql` の内容を実行
5. **Authentication → Providers** でGoogleプロバイダを有効化（任意）
6. **Authentication → URL Configuration** に以下を追加:
   - Site URL: `http://localhost:3000`（本番は本番ドメイン）
   - Redirect URLs: `http://localhost:3000/auth/callback`

### admin権限の付与

Supabaseダッシュボードの **SQL Editor** で以下を実行:

```sql
update profiles
set role = 'admin'
where id = 'YOUR_USER_UUID';
```

ユーザーUUIDは **Authentication → Users** から確認できます。

---

## Mapbox設定方法

1. [Mapbox](https://mapbox.com) でアカウントを作成
2. ダッシュボードからアクセストークンを取得
3. `.env.local` に `NEXT_PUBLIC_MAPBOX_TOKEN` として設定
4. **本番環境では** トークンの **Allowed URLs** に本番ドメインを設定してください
5. 開発用と本番用でトークンを分けることを推奨します

---

## ローカル起動方法

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

## ビルド方法

```bash
npm run build
npm run start
```

---

## デプロイ方法（Vercel）

1. GitHubにリポジトリをpush
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. 環境変数を設定（下記参照）
4. デプロイ

### Vercel環境変数設定手順

Vercelダッシュボードの **Settings → Environment Variables** に以下を追加:

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapboxアクセストークン |

デプロイ後、Supabaseの **Authentication → URL Configuration** に本番ドメインを追加してください。

---

## 別PCでのセットアップ手順

```bash
# 1. GitHubからクローン
git clone https://github.com/YOUR_USERNAME/bicycle-safety-app.git
cd bicycle-safety-app

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数ファイルを作成（.env.localはGit管理対象外）
cp .env.example .env.local
# → .env.local を編集してAPIキーを入力

# 4. 開発サーバー起動
npm run dev
```

`.env.local` はGit管理対象外のため、別PCでは毎回手動で作成・入力が必要です。
APIキーはパスワードマネージャーや安全な方法で管理してください。

---

## 危険地点接近通知の制約

- アプリが**ブラウザで開いている間のみ**動作します（バックグラウンド通知は非対応）
- 位置情報の利用許可が必要です
- 通知の許可がブラウザで必要です（設定画面から有効化）
- 同じ地点への再通知は**30分間**クールダウンがあります
- 現在地の更新は**10秒ごと**に行われます

---

## ディレクトリ構成

```
bicycle-safety-app/
├── src/
│   ├── app/              # Next.js App Router ページ
│   │   ├── admin/        # 管理者画面
│   │   ├── auth/         # 認証ページ
│   │   ├── mypage/       # マイページ
│   │   ├── post/         # 投稿ページ
│   │   ├── rules/        # 交通ルール記事
│   │   ├── settings/     # 設定ページ
│   │   └── spots/        # 地点詳細
│   ├── components/       # 共通コンポーネント
│   ├── hooks/            # カスタムフック
│   ├── lib/              # ユーティリティ・Supabaseクライアント
│   └── types/            # TypeScript型定義
├── supabase/
│   └── migrations/       # DBマイグレーションSQL
├── public/               # 静的ファイル（manifest.json等）
├── .env.example          # 環境変数テンプレート
└── README.md
```

---

## セキュリティ注意事項

- Mapboxトークンの **Allowed URLs** は本番ドメインに制限してください
- 開発用と本番用でMapboxトークンを分けることを推奨します
- 本番監視には Sentry 等の導入を推奨します
- admin権限はアプリ経由で付与できません。必ずSupabaseダッシュボードまたはSQL直接実行で付与してください
