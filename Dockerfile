FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV MOCK_INFERENCE_MODE=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:docker

EXPOSE 3000
CMD ["npx", "tsx", "src/server/index.ts"]
