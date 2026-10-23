# The game server in a container. Build from the project folder (it needs content/ and the maps):
#   docker build -f server/Dockerfile -t my-game-server .
#   docker run -d -p 8787:8787 -v game-data:/app/server/data -e ADMIN_TOKEN=… my-game-server
FROM node:24-alpine
WORKDIR /app
COPY server/*.mjs server/
COPY content/*.json content/
COPY public/assets/maps public/assets/maps
# The data folder belongs to the user the server runs as (a volume mounted here keeps it)
RUN mkdir -p server/data && chown node:node server/data
ENV PORT=8787
EXPOSE 8787
USER node
CMD ["node", "server/index.mjs"]
