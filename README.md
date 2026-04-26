# cdn.toolbomber.com

Static CDN hosting small, self-contained libraries and assets for projects.

- **Public URL**: <https://cdn.toolbomber.com/>
- **Hosting**: Vercel (auto-deploys from `master` on push — no build step,
  files are served as-is)
- **Source repo**: this repo (public on GitHub at
  [jikkuatwork/cdn](https://github.com/jikkuatwork/cdn))
- **Mirror**: jsDelivr automatically serves any public GitHub repo, so the
  same artifacts are available at
  `https://cdn.jsdelivr.net/gh/jikkuatwork/cdn@<ref>/<path>`. Useful when a
  consumer's CSP doesn't allow `cdn.toolbomber.com` but does allow jsDelivr
  (most curated allowlists do).

## Layout

### `libs/` — versioned libraries (preferred)

```
libs/<name>/v-X.Y.Z/<file>
libs/<name>/v-latest          → symlink to the newest v-X.Y.Z
```

- One folder per published version (no overwrites).
- `v-latest` is a symbolic link, not a copy — Vercel resolves it server-side.
- Pin to `v-X.Y.Z` in production; use `v-latest` only for dev / one-off scripts.

Example URLs (Vercel + jsDelivr serve the same content):

```
# Vercel
https://cdn.toolbomber.com/libs/feed-stars/v-0.0.2/feed-stars.min.mjs
https://cdn.toolbomber.com/libs/feed-stars/v-latest/feed-stars.min.mjs

# jsDelivr (commit-pinned — cached forever)
https://cdn.jsdelivr.net/gh/jikkuatwork/cdn@<sha>/libs/feed-stars/v-0.0.2/feed-stars.min.mjs

# jsDelivr (branch ref — cached 12h)
https://cdn.jsdelivr.net/gh/jikkuatwork/cdn@master/libs/feed-stars/v-0.0.2/feed-stars.min.mjs
```

### `js/`, `css/`, `pv-components/`, `logos/` — flat unversioned assets

Pre-versioning artifacts (Cupboard, Shelf, WebArray, TextDB, SimpleCrypto,
RemoteHash, fonts, logos, etc.). Kept as-is for backwards compatibility;
prefer `libs/` for anything new.

## Publishing a new lib

```sh
NAME=feed-stars
VER=0.0.1
DEST=libs/$NAME/v-$VER

mkdir -p "$DEST"
cp /path/to/built/$NAME.mjs    "$DEST/"
cp /path/to/built/$NAME.min.mjs "$DEST/"

(cd libs/$NAME && rm -f v-latest && ln -s "v-$VER" v-latest)

git add libs/$NAME
git commit -m "Add $NAME v$VER"
git push    # Vercel auto-deploys
```

## Conventions

- ES modules use the `.mjs` extension; minified version ends in `.min.mjs`.
- Bundle one library per file when possible (no peer-dep graphs).
- Sourcemaps are welcome (`*.map` next to the artifact).
