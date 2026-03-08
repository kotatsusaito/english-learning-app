#!/bin/bash

# 最終版デプロイスクリプト - 最もシンプルな方法
set -e

PROJECT_ID="my-project-english-training"
REGION="asia-northeast1"

echo "========================================="
echo "English Learning App - Final Deploy"
echo "========================================="

# Backend デプロイ
echo "Deploying backend..."
cd backend

# ローカルでビルド
npm install
npm run build

# Dockerfileを作成（インライン）
cat > Dockerfile.deploy <<'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
DOCKERFILE

# Docker イメージをビルドしてプッシュ
docker build -f Dockerfile.deploy -t gcr.io/$PROJECT_ID/english-learning-backend:latest .
docker push gcr.io/$PROJECT_ID/english-learning-backend:latest

# Cloud Run にデプロイ
gcloud run deploy english-learning-backend \
    --image gcr.io/$PROJECT_ID/english-learning-backend:latest \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest"

BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "✓ Backend deployed: $BACKEND_URL"

# Frontend デプロイ
cd ../frontend
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production

npm install
npm run build

# Dockerfileを作成（インライン）
cat > Dockerfile.deploy <<'DOCKERFILE'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

# Docker イメージをビルドしてプッシュ
docker build -f Dockerfile.deploy -t gcr.io/$PROJECT_ID/english-learning-frontend:latest .
docker push gcr.io/$PROJECT_ID/english-learning-frontend:latest

# Cloud Run にデプロイ
gcloud run deploy english-learning-frontend \
    --image gcr.io/$PROJECT_ID/english-learning-frontend:latest \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi

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
