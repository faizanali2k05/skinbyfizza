# Skin By Dr. Fizza G — backend API image
FROM node:20-alpine

WORKDIR /app

# Install production deps first (better layer caching)
COPY package.json ./
RUN npm install --omit=dev

# App source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
