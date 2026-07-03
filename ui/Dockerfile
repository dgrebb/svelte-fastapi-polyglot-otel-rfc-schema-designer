# SvelteKit (@sveltejs/adapter-node) — multi-stage, pnpm, Node 24 LTS
# @see https://gist.github.com/holiveim/db623dc1c8b121d03470b6fd2150a020
# @see https://gist.github.com/AradAlvand/04b2cad14b00e5ffe8ec96a3afbb34fb

ARG NODE_IMAGE=node:24-alpine

# --- Dev (compose bind-mount + hot reload) ------------------------------------

FROM ${NODE_IMAGE} AS dev

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["corepack", "pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# --- Builder ------------------------------------------------------------------

FROM ${NODE_IMAGE} AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build && \
    pnpm prune --prod && \
    find build -name "*.map" -delete

# --- Production runner --------------------------------------------------------

FROM ${NODE_IMAGE} AS runner

LABEL org.opencontainers.image.description="svelte-fastapi-remote-functions UI (SvelteKit)"
LABEL org.opencontainers.image.source="https://github.com/svelte-fastapi-remote-functions"

RUN apk upgrade -U --no-cache && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

RUN find build node_modules \( \
        -type d -empty \
        -o -iname "license*" \
        -o -name "*.md" \
        -o -name "*.txt" \
        -o -name "*.map" \
        -o -name ".git*" \
        -o -name "*.yml" \
        -o -name "*.yaml" \
        -o -name "*.json" -path "*/test/*" \
        -o -name "*.json" -path "*/tests/*" \
        -o -name "test" -type d \
        -o -name "tests" -type d \
        -o -name "__tests__" -type d \
        -o -name "coverage" -type d \
        -o -name ".nyc_output" -type d \
    \) -delete 2>/dev/null || true && \
    find build -name "*.map" -delete && \
    rm -rf /tmp/*

USER node

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:3000/status?format=json" || exit 1

CMD ["node", "build"]
