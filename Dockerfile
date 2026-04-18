# Build API + static client (Vite)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY leaderboard-server/package.json leaderboard-server/
COPY leaderboard-client/package.json leaderboard-client/

RUN npm install --workspaces --include-workspace-root

COPY leaderboard-server leaderboard-server
COPY leaderboard-client leaderboard-client

RUN npm run build -w leaderboard-server && npm run build -w leaderboard-client

# Production: Node serves REST API + prebuilt SPA (see CLIENT_DIST in server)
FROM node:22-alpine
WORKDIR /app/leaderboard-server

ENV NODE_ENV=production
COPY leaderboard-server/package.json ./
RUN npm install --omit=dev

COPY --from=build /app/leaderboard-server/dist ./dist
COPY --from=build /app/leaderboard-client/dist /app/leaderboard-client/dist

ENV PORT=3001
ENV CLIENT_DIST=/app/leaderboard-client/dist
# Persistent leaderboard (mount a volume at /data on the host)
RUN mkdir -p /data
ENV SQLITE_PATH=/data/leaderboard.db
VOLUME ["/data"]
EXPOSE 3001

CMD ["node", "dist/index.js"]
