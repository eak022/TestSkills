FROM node:24-alpine AS base 
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

RUN npm install -g bun

FROM base AS installer

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

FROM base AS builder

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY . .

RUN bun run generate
RUN bun run prisma:deploy

RUN bun build \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outdir ./dist \
	./src/app.ts

FROM base AS release

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

EXPOSE 3000
ENTRYPOINT [ "bun", "./dist/app.js" ]