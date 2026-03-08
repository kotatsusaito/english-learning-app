# Google Cloud Platform デプロイメントガイド

このガイドでは、English Learning App を Google Cloud Platform (GCP) にデプロイする方法を説明します。

## 前提条件

1. Google Cloud アカウント
2. gcloud CLI のインストール
3. プロジェクトの作成

## セットアップ手順

### 1. gcloud CLI のインストール

```bash
# macOS
brew install google-cloud-sdk

# または公式サイトからダウンロード
# https://cloud.google.com/sdk/docs/install
```

### 2. gcloud の初期化

```bash
gcloud init
gcloud auth login
```

### 3. プロジェクトの作成（まだない場合）

```bash
# GCP コンソールでプロジェクトを作成するか、CLIで作成
gcloud projects create your-project-id --name="English Learning App"
```

### 4. 環境変数の設定

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-northeast1"  # 東京リージョン
```

### 5. API キーの設定（Secret Manager）

```bash
# Claude API キーを設定
echo -n "your-claude-api-key" | gcloud secrets create CLAUDE_API_KEY \
    --data-file=- \
    --replication-policy="automatic"

# OpenAI API キー（オプション）
echo -n "your-openai-api-key" | gcloud secrets create OPENAI_API_KEY \
    --data-file=- \
    --replication-policy="automatic"
```

### 6. デプロイの実行

```bash
# デプロイスクリプトを実行
bash deploy.sh
```

## 手動デプロイ

自動スクリプトを使わない場合は、以下の手順で手動デプロイできます。

### バックエンドのデプロイ

```bash
cd backend

gcloud run deploy english-learning-backend \
    --source . \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest"
```

### フロントエンドのデプロイ

```bash
# バックエンドのURLを取得
BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region asia-northeast1 \
    --format 'value(status.url)')

# 環境変数ファイルを作成
echo "VITE_API_BASE_URL=${BACKEND_URL}" > frontend/.env.production

cd frontend

gcloud run deploy english-learning-frontend \
    --source . \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi
```

## 環境変数の更新

デプロイ後に環境変数を更新する場合：

```bash
# バックエンド
gcloud run services update english-learning-backend \
    --region asia-northeast1 \
    --set-env-vars "AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307"

# フロントエンド（再デプロイが必要）
# .env.production を更新してから再デプロイ
```

## Secret Manager の更新

```bash
# 既存のシークレットを更新
echo -n "new-api-key" | gcloud secrets versions add CLAUDE_API_KEY --data-file=-
```

## ログの確認

```bash
# バックエンドのログ
gcloud run services logs read english-learning-backend \
    --region asia-northeast1 \
    --limit 50

# フロントエンドのログ
gcloud run services logs read english-learning-frontend \
    --region asia-northeast1 \
    --limit 50
```

## コスト管理

Cloud Run は使用した分だけ課金されます：

- **バックエンド**: リクエストごとに課金
- **フロントエンド**: リクエストごとに課金
- **無料枠**: 月間200万リクエストまで無料

### コスト削減のヒント

1. 最小インスタンス数を0に設定（デフォルト）
2. メモリとCPUを必要最小限に設定
3. タイムアウトを適切に設定

## トラブルシューティング

### デプロイが失敗する場合

```bash
# ビルドログを確認
gcloud builds list --limit=5

# 詳細なログを確認
gcloud builds log [BUILD_ID]
```

### サービスが起動しない場合

```bash
# サービスの詳細を確認
gcloud run services describe english-learning-backend \
    --region asia-northeast1

# ログを確認
gcloud run services logs read english-learning-backend \
    --region asia-northeast1
```

### API キーが認識されない場合

```bash
# Secret Manager の権限を確認
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:your-project-number-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## カスタムドメインの設定

```bash
# ドメインマッピングを作成
gcloud run domain-mappings create \
    --service english-learning-frontend \
    --domain your-domain.com \
    --region asia-northeast1
```

## サービスの削除

```bash
# バックエンドを削除
gcloud run services delete english-learning-backend --region asia-northeast1

# フロントエンドを削除
gcloud run services delete english-learning-frontend --region asia-northeast1
```

## 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Cloud Run 料金](https://cloud.google.com/run/pricing)
