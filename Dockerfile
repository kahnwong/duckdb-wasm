FROM caddy:2-alpine

RUN apk add --no-cache git
RUN rm -rf /usr/share/caddy && \
    git clone -b gh-pages --depth 1 https://github.com/duckdb/duckdb-wasm.git /usr/share/caddy

