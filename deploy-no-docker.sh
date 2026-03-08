#!/bin/bash

# Docker不要のデプロイスクリプト - Cloud Buildを使用
set -e

PROJECT_ID="my-project-english-training"
REGION="asia-northeast1"

echo "========================================="
echo "English Learning App - Cloud Build Deploy"
echo "========================================="

# Shared パッケージをビルド
echo "Step 1: Building shared package..."
cd shared
npm install
npm run build
cd ..

# Backend をビルド
echo "Step 2: Building backend..."
cd backend
npm install
npm run build

# Backend用のDockerfileを作成
cat > Dockerfile <<'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
EOF

# Cloud Buildでビルドしてデプロイ
echo "Step 3: Building and deploying backend with Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/english-learning-backend .

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

BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "✓ Backend deployed: $BACKEND_URL"

# Frontend をビルド
cd ../frontend
echo "Step 4: Building frontend..."
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production
npm install
npm run build

# Frontend用のDockerfileを作成
cat > Dockerfile <<'EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Cloud Buildでビルドしてデプロイ
echo "Step 5: Building and deploying frontend with Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/english-learning-frontend .

gcloud run deploy english-learning-frontend \
    --image gcr.io/$PROJECT_ID/english-learning-frontend \
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
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL"
echo "2. Select your CEFR level"
echo "3. Start learning!"
