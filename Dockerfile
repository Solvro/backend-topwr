FROM node:22.14.0-alpine3.21 AS base
WORKDIR /app
ADD package.json package-lock.json ./

# Production only deps stage
FROM base AS prod-deps
# try to do a regular install (as it doesn't remove the existing node_modules dir)
# then diff the package-lock - if it changed, do a clean install instead
RUN --mount=type=cache,dst=/root/.npm \
    --mount=type=cache,dst=/tmp/node-compile-cache \
    cp package-lock.json package-lock.json.old && \
    npm i --omit=dev --ignore-scripts --no-audit --no-fund && \
    (diff package-lock.json package-lock.json.old > /dev/null || npm ci --omit=dev --ignore-scripts --no-audit --no-fund) && \
    rm package-lock.json.old

# All deps stage
FROM prod-deps AS dev-deps
RUN --mount=type=cache,dst=/root/.npm \
    --mount=type=cache,dst=/tmp/node-compile-cache/ \
    cp package-lock.json package-lock.json.old && \
    npm i --ignore-scripts --no-audit --no-fund && \
    (diff package-lock.json package-lock.json.old > /dev/null || npm ci --ignore-scripts --no-audit --no-fund) && \
    rm package-lock.json.old

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
