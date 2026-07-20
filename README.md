# SignTec Image Solutions website

Static site for **signtecs.net** (Ninja Jo Artworks webmaster).

## Deploy (Cloudflare)

- **Live assets:** only files under `public/` (see `wrangler.jsonc` → `assets.directory`)
- Do **not** point assets at repo root — that uploads `node_modules` and fails the 25 MiB limit

After push to `main`, Cloudflare rebuilds. Local:

```bash
npm install
npx wrangler deploy
```

## Edit workflow

Prefer editing:

`D:\ninja jo artworks\Clients\SignTec\Website\`

Then copy into `public/` here and push, or edit `public/` directly.

Ops notes: `DEPLOY.txt`, `GO-LIVE-NOW.txt`
