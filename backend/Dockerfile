FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
