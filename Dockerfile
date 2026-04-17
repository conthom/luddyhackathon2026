FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --workspaces --include-workspace-root
COPY server server
COPY client client
RUN npm run build -w server && npm run build -w client

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY server/package.json server/
RUN npm install --workspace server --omit=dev
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
