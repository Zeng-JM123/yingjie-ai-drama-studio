FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.mjs ./
COPY store.mjs ./
COPY production-service.mjs ./
ENV DATABASE_PATH=/data/yingjie.db
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server.mjs"]
