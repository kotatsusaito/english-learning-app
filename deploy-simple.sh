#!/bin/bash

# シンプルなGCPデプロイスクリプト
set -e

PROJECT_ID="my-project-english-training"
REGION="asia-northeast1"

echo "========================================="
echo "English Learning App - Simple Deploy"
echo "========================================="

# 1. Shared パッケージをビルド
echo "Step 1: Building shared package..."
cd shared
npm install
npm run build
cd ..

# 2. Backend をビルド
echo "Step 2: Building backend..."
cd backend
npm install
npm run build

# 3. Backend をデプロイ（ビルド済みファイルを使用）
echo "Step 3: Deploying backend to Cloud Run..."
gcloud builds submit \
    --project $PROJECT_ID \
    --config cloudbuild.prod.yaml \
    .

gcloud run deploy english-learning-backend \
    --image gcr.io/$PROJECT_ID/english-learning-backend \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest"

# Backend URLを取得
BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "✓ Backend deployed: $BACKEND_URL"

# 4. Frontend 環境変数を設定
cd ../frontend
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production

# 5. Frontend をビルド
echo "Step 4: Building frontend..."
npm install
npm run build

# 6. Frontend をデプロイ
echo "Step 5: Deploying frontend to Cloud Run..."
gcloud builds submit \
    --project $PROJECT_ID \
    --config cloudbuild.prod.yaml \
    .

gcloud run deploy english-learning-frontend \
    --image gcr.io/$PROJECT_ID/english-learning-frontend \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi

# Frontend URLを取得
FRONTEND_URL=$(gcloud run services describe english-learning-frontend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "========================================="
echo "🎉 Deployment Complete!"
echo "========================================="
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "========================================="
