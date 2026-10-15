
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
              /usr/local/bin/npm \
              /usr/local/bin/npx \
              /root/.npm \
              /home/node/.npm

COPY server.js .
COPY application.js .
COPY public ./public

EXPOSE 3000

USER node

CMD ["node", "server.js"]
