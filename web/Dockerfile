# Skin By Dr. Fizza G — web client image.
# Multi-stage: build the static SPA, then serve it from nginx.

# ── build ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

# Vite inlines env at BUILD time, so the API URL must be present here — not at
# container start. Override per environment via docker-compose build args.
ARG VITE_API_BASE_URL=http://localhost:8121
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── serve ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
