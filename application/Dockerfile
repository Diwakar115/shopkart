
FROM node:24-alpine

WORKDIR /app

# Upgrade the bundled npm toolchain to patched dependencies
RUN npm install --global npm@latest

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js .
COPY application.js .
COPY public ./public

EXPOSE 3000

USER node

CMD ["npm", "start"]

