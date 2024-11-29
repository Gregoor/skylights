# Skylights

## Development Setup

```sh
cd web

#skip this step if you've already generated a private key / have a .env file setup
pnpm exec tsx ./scripts/generate-jwk.mts > .env

pnpm install
pnpm dev
```
