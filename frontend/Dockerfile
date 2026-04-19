# --- build ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Controls what unauthenticated visitors see at "/". See docker-compose for
# accepted values ("login" or "landing"). Defaults to "login" to preserve
# the original behaviour for existing deployments.
ARG VITE_LANDING_MODE=login
ENV VITE_LANDING_MODE=${VITE_LANDING_MODE}

RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
