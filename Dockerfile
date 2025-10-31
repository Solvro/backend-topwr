FROM node:22-alpine AS base
RUN apk add --no-cache curl
WORKDIR /app
ADD package.json package-lock.json ./

# Production only deps stage
FROM base AS prod-deps
RUN --mount=type=cache,dst=/root/.npm \
    --mount=type=cache,dst=/tmp/node-compile-cache \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# All deps stage
FROM prod-deps AS dev-deps
RUN --mount=type=cache,dst=/root/.npm \
    --mount=type=cache,dst=/tmp/node-compile-cache/ \
    npm ci --ignore-scripts --no-audit --no-fund

# Production stage
FROM prod-deps
# docker mount magic: mount the context dir into /source, mount devdeps into /source/node_modules, mount tmpfs on /tmp to omit tmp files from the image
#  start the build, then move build files into the image - no copying between stages 😎
RUN --mount=type=bind,dst=/source,rw \
    --mount=type=bind,from=dev-deps,source=/app/node_modules,dst=/source/node_modules \
    --mount=type=tmpfs,dst=/tmp \
    cd /source &&\
    node ace build &&\
    rm /source/build/package.json /source/build/package-lock.json &&\
    mv /source/build/* /app
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "./bin/server.js"]
