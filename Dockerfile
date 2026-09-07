FROM node:22-bookworm-slim
WORKDIR /app

ENV MOCK_INFERENCE_MODE=true

COPY package.json package-lock.json ./
# Keep NODE_ENV unset during install so vite/typescript stay available for the build.
RUN npm ci

COPY . .
RUN npm run build:docker

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "tsx", "src/server/index.ts"]
