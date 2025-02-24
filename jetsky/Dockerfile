FROM rust:1.83.0-bullseye as builder
WORKDIR /usr/src/jetsky
COPY . .
RUN --mount=type=bind,source=src,target=src \
    --mount=type=bind,source=Cargo.toml,target=Cargo.toml \
    --mount=type=bind,source=Cargo.lock,target=Cargo.lock \
    --mount=type=cache,target=/app/target/ \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    <<EOF
set -e
cargo build --locked --release
cp ./target/release/jetsky /bin/jetsky
EOF

FROM debian:bullseye-slim as runner
ARG UID=10001
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates
RUN update-ca-certificates
RUN apt install libssl-dev
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser
COPY --from=builder /bin/jetsky /bin/
CMD ["/bin/jetsky"]