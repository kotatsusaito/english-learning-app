# Frontend Dockerfile for Google Cloud Run
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=frontend --workspace=shared

# Copy source code
COPY shared ./shared
COPY frontend ./frontend

# Build shared package
RUN npm run build --workspace=shared

# Build frontend
RUN npm run build --workspace=frontend

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
