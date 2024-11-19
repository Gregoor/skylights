# Dev Setup

## Search

```sh
cd search
docker build --progress=plain -t my-quickwit . && docker run -p 7280:7280
```

## Web

```sh
cd web
echo QUICKWIT_HOST=http://localhost:7280 > .env
pnpm install
pnpm dev
```
