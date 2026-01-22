# syntax=docker/dockerfile:1.6
# v0.8.2-rc1
#
# Notes:
# - This Dockerfile is hardened for npm ci stability under BuildKit/overlayfs.
# - It prevents npm cache corruption/race issues that manifest as:
#   - npm ERR! EEXIST / ENOENT mkdir .../_cacache/...
#   - npm warn tar TAR_ENTRY_ERROR ENOENT (packages partially extracted)
# - Strategy:
#   1) Use BuildKit cache mount for npm cache (stable across layers)
#   2) Force-clean & recreate cache dir before npm ci
#   3) Keep permissions deterministic for node user

# Base node image
FROM node:20-alpine AS node

# Install jemalloc
RUN apk add --no-cache jemalloc
RUN apk add --no-cache python3 py3-pip uv

# Set environment variable to use jemalloc
ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

# Add `uv` for extended MCP support
COPY --from=ghcr.io/astral-sh/uv:0.9.5-python3.12-alpine /usr/local/bin/uv /usr/local/bin/uvx /bin/
RUN uv --version

# Create app dir with deterministic ownership
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

USER node

# Copy only manifests first for better layer caching
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node api/package.json ./api/package.json
COPY --chown=node:node client/package.json ./client/package.json
COPY --chown=node:node packages/data-provider/package.json ./packages/data-provider/package.json
COPY --chown=node:node packages/data-schemas/package.json ./packages/data-schemas/package.json
COPY --chown=node:node packages/api/package.json ./packages/api/package.json

# Install dependencies (hardened)
# - BuildKit cache mount for npm cache (stable)
# - Set cache ownership to node (uid=1000,gid=1000) to avoid EACCES
ENV NPM_CONFIG_CACHE=/tmp/.npm

RUN --mount=type=cache,target=/tmp/.npm,uid=1000,gid=1000 \
    set -eux; \
    touch .env; \
    mkdir -p /app/client/public/images /app/logs /app/uploads; \
    rm -rf /tmp/.npm/_cacache /tmp/.npm/_logs /tmp/.npm/_update-notifier-last-checked || true; \
    mkdir -p /tmp/.npm; \
    npm config set fetch-retry-maxtimeout 600000; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-mintimeout 15000; \
    npm ci --no-audit --cache /tmp/.npm


# Copy the rest of the repo
COPY --chown=node:node . .

# Hotfix compatibility: keep sendEmail path in sync (your previous patch)
RUN if [ -f /app/api/server/sendEmail.js ]; then \
        cp /app/api/server/sendEmail.js /app/api/server/utils/sendEmail.js; \
    fi

# Build + prune (hardened)
# - Use BuildKit cache mount again for npm cache operations during prune/clean
RUN --mount=type=cache,target=/tmp/.npm,uid=1000,gid=1000 \
    set -eux; \
    export npm_config_cache=/tmp/.npm; \
    NODE_OPTIONS="--max-old-space-size=2048" npm run frontend; \
    npm prune --omit=dev; \
    npm cache clean --force

# Node API setup
EXPOSE 3080
ENV HOST=0.0.0.0
CMD ["npm", "run", "backend"]

# Optional: for client with nginx routing
# FROM nginx:stable-alpine AS nginx-client
# WORKDIR /usr/share/nginx/html
# COPY --from=node /app/client/dist /usr/share/nginx/html
# COPY client/nginx.conf /etc/nginx/conf.d/default.conf
# ENTRYPOINT ["nginx", "-g", "daemon off;"]

# Brand override - must run AFTER client dist is generated
RUN set -eux; \
  if [ -f /app/client/dist/index.html ]; then \
    sed -i 's#<title>LibreChat</title>#<title>Re AI Radio Station</title>#g' /app/client/dist/index.html; \
  fi; \
  if [ -f /app/client/dist/manifest.webmanifest ]; then \
    sed -i 's#"name"[[:space:]]*:[[:space:]]*"LibreChat"#"name":"Re AI Radio Station"#g' /app/client/dist/manifest.webmanifest; \
    sed -i 's#"short_name"[[:space:]]*:[[:space:]]*"LibreChat"#"short_name":"Re AI Radio"#g' /app/client/dist/manifest.webmanifest; \
  fi
