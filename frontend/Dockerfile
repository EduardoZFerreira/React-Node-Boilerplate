# syntax=docker/dockerfile:1
#
# Optional: only needed if you want to self-host the frontend as a container
# (e.g. behind your own reverse proxy). Static hosts like Vercel/Netlify/
# Cloudflare Pages are a simpler default — see the README's deployment guide.

# ---- build: produce the static Vite build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL is baked into the JS bundle at build time (Vite env vars are
# not readable at runtime) — pass the real backend URL as a build arg.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- production: serve the static build with Nginx ----
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
