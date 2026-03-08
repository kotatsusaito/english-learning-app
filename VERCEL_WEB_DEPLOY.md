# Vercel Web UI デプロイ手順

## ステップ1: GitHubにコードをプッシュ

### 1.1 GitHubでリポジトリを作成
1. https://github.com/new にアクセス
2. Repository name: `english-learning-app`
3. Public または Private を選択
4. 「Create repository」をクリック

### 1.2 ローカルからプッシュ

新しいターミナルで：

```bash
cd "/Users/kotatsusaito/English Study"

# Gitリポジトリを初期化
git init

# すべてのファイルを追加
git add .

# コミット
git commit -m "Initial commit: English Learning App"

# リモートリポジトリを追加（YOUR_USERNAMEを自分のGitHubユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/english-learning-app.git

# プッシュ
git branch -M main
git push -u origin main
```

## ステップ2: Vercelでバックエンドをデプロイ

### 2.1 プロジェクトをインポート
1. https://vercel.com にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ `english-learning-app` を選択
4. 「Import」をクリック

### 2.2 バックエンドの設定
- **Project Name**: `english-learning-backend`
- **Framework Preset**: Other
- **Root Directory**: `backend` を選択
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 環境変数を追加
「Environment Variables」セクションで以下を追加：

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `AI_SERVICE` | `claude` |
| `CLAUDE_MODEL` | `claude-3-haiku-20240307` |
| `CLAUDE_API_KEY` | あなたのClaude APIキー |

### 2.4 デプロイ
「Deploy」をクリック

デプロイが完了したら、URLをコピー（例: `https://english-learning-backend-xxx.vercel.app`）

## ステップ3: Vercelでフロントエンドをデプロイ

### 3.1 新しいプロジェクトを作成
1. Vercelダッシュボードに戻る
2. 「Add New...」→「Project」をクリック
3. 同じGitHubリポジトリ `english-learning-app` を選択
4. 「Import」をクリック

### 3.2 フロントエンドの設定
- **Project Name**: `english-learning-frontend`
- **Framework Preset**: Vite
- **Root Directory**: `frontend` を選択
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 環境変数を追加
「Environment Variables」セクションで以下を追加：

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | バックエンドのURL（ステップ2.4でコピーしたURL） |

### 3.4 デプロイ
「Deploy」をクリック

## ステップ4: 完了！

フロントエンドのデプロイが完了したら、表示されたURLにアクセスしてアプリを使用できます。

## トラブルシューティング

### ビルドエラーが発生した場合

1. Vercelのデプロイログを確認
2. ローカルでビルドテスト：
   ```bash
   cd backend
   npm install
   npm run build
   
   cd ../frontend
   npm install
   npm run build
   ```
3. エラーを修正してGitHubにプッシュ
4. Vercelが自動的に再デプロイ

### 環境変数を更新したい場合

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 変数を編集
4. 「Redeploy」をクリック

## 自動デプロイ

以降、`main`ブランチにプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "Update feature"
git push
```

Vercelが自動的に検知して再デプロイします。
