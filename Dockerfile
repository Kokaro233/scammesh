FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV MOCK_INFERENCE_MODE=true
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
