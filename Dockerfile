FROM node:22.14.0-alpine3.21 AS base
WORKDIR /app
ADD package.json package-lock.json ./

# All deps stage
FROM base AS dev-deps
RUN npm ci

# Production only deps stage
FROM base AS prod-deps
RUN npm ci --omit=dev

# Build stage
FROM dev-deps AS build
ADD . .
RUN node ace build

# Production stage
FROM prod-deps
ENV NODE_ENV=production
COPY --from=build /app/build /app
EXPOSE 8080
CMD ["node", "./bin/server.js"]
