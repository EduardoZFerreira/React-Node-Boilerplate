# syntax=docker/dockerfile:1

# ---- deps: installed once, shared by the dev and build stages ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- dev: used by docker-compose for local development ----
# Source is bind-mounted over this at runtime (see docker-compose.yml), so
# `npm run dev` (tsx watch) picks up file changes without rebuilding the image.
FROM deps AS dev
COPY . .
EXPOSE 8081
CMD ["npm", "run", "dev"]

# ---- build: compiles TypeScript and generates the Prisma client ----
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- production: minimal runtime image, no devDependencies or source ----
FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# Prisma's generated client lives inside node_modules — copy it from the build
# stage instead of running `prisma generate` again here, since that would
# require the (devDependency) prisma CLI in this otherwise prod-only image.
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build --chown=node:node /app/dist ./dist

# node:22-slim ships a preexisting, unprivileged "node" user — don't run the
# app as root just because that's the image default.
USER node

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/healthcheck', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
