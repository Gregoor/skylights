# Skylights

## Development Setup

Requirements:

- a running PostgreSQL database with write access
- [a TMDB API key](https://www.themoviedb.org/settings/api)

You must also place a `.env` file with the following variables in the root directory:

```
POSTGRES_URL=postgresql://user:password@localhost:5432/database
TMDB_API_KEY=your_tmdb_api_key_here
```

```sh
#skip this step if you've already generated a private key / have a .env file setup
pnpm exec tsx ./scripts/generate-jwk.mts >> .env

pnpm install
pnpm migrate
pnpm dev
```
