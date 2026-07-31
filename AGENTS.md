# AGENTS.md — bilibili-repo

## Project overview

`bilibili-repo` (v0.2.0) is a personal, self-hosted local archive for Bilibili videos. It:

1. Downloads videos from bilibili.com (by `aid`) using the external `lux` CLI downloader and `ffmpeg`, storing each video under `repo/<aid>/` together with its thumbnail and danmaku (comments).
2. Indexes all downloaded videos in a LokiJS database (`repo/storage.db`).
3. Serves a web UI (Express backend on port **8081**, Lit-based frontend) to browse, search, and play archived videos with danmaku, organize them into playlists, and mark timestamps.

The project is developed and run on **Windows** (Git Bash); several paths are Windows-specific (e.g. ``repo\${aid}_download``, spawning `downloader/lux` and `downloader/ffmpeg` resolves to the bundled `.exe` files).

## Repository layout

- `src/common/` — shared code used by both server and viewer:
  - `api/Api.ts` — the single source of truth for the HTTP API surface. `RawApis` declares every endpoint as an `ApiGet`/`ApiPost` object with both the Express route pattern (`srvPattern`) and the client URL builder (`reqPattern`). The `server`/`client` singletons are injected at runtime (server side installs `serve*` implementations, viewer side installs `fetch*` implementations), so both sides share one typed API definition.
  - `types.ts` — Bilibili API JSON types (`BilibiliVideoJson`, `BilibiliVideo`, ...).
  - `page.ts`, `DownloadStatus.ts` — shared model types.
- `src/server/` — Express 5 backend:
  - `webserver.ts` — entry point. Wires CORS/body-parser, serves static dirs, and registers every endpoint from `RawApis`. Listens on port **8081** (hardcoded).
  - `ServerApi.ts` — installs the `serve*` implementations and a JSON serializer that strips LokiJS internals (`meta`, `$loki`).
  - `download/Downloader.ts` — in-memory download queue (`enqueue`/`remove`/`redownload`, one video at a time, status reporting for the UI).
  - `download/Bilibili.ts` — talks to bilibili.com: video info API, thumbnail/face download, danmaku download and XML→JSON conversion, and spawning `lux`/`ffmpeg` child processes. Downloaded parts land in `repo/<aid>_download/` and the folder is renamed to `repo/<aid>` on success.
  - `download/DanmakuProto.ts` — fetches danmaku via the segmented protobuf API (`x/v2/dm/web/view` + WBI-signed `x/v2/dm/wbi/web/seg.so`, unsigned `web/seg.so` as per-segment fallback) and renders it to the same `<d p="...">` XML format as the legacy `comment.bilibili.com/<cid>.xml` endpoint (which `Bilibili.downloadDanmaku` still falls back to on failure). Sends cookies from `downloader/cookies.txt` (a valid `SESSDATA` returns more danmaku); contains a minimal hand-rolled protobuf reader and WBI md5 signing.
  - `storage/Storage.ts` — LokiJS persistence (`repo/storage.db`, autosave every 4 s). On first run it scans `repo/<aid>/info.json` for every video folder and imports them. Five tables: `video` (key `aid`), `part` (key `cid`), `member` (key `mid`), `playlist` (key `pid`), `timestamp` (key `tid`); row shapes are in `storage/dbTypes.ts`.
  - `storage/Table.ts` — generic typed wrapper around a LokiJS collection.
  - `fanCount.ts` — fetches the account's follower-count history from bilibili (uses `downloader/cookies.txt`).
  - `network.ts` — `httpsget` / `httpsdownload` helpers.
- `src/viewer/` — browser frontend, plain Lit 3 custom elements (no framework), one webpack entry per page:
  - `index/index.ts`, `member.ts`, `playlist.ts` — library pages (browse/search videos, members, playlists, timestamps, download queue).
  - `watch/watch.ts` — playback page; `Player.ts` wraps **DPlayer** with a custom `apiBackend` that feeds the locally stored danmaku JSON.
  - `download/download.ts` — download-management page.
  - `elements/` — reusable Lit components (cards, paged containers, playlist editor, ...).
  - `common/api/ClientApi.ts` — installs the `fetch*` side of the shared API layer (XMLHttpRequest-based); user-facing error messages are in Chinese.
- `static/` — HTML pages (`index.html`, `watch.html`, `member.html`, `playlist.html`, `download.html`), global `app.css`, and `lib/DPlayer.min.css`. Each page loads its bundle from `/dist/<name>.js`.
- `repo/` — **data directory** (gitignored): `repo/<aid>/{info.json, thumb.jpg, pN.mp4, pN.xml, pN.json}`, `repo/member/<mid>.jpg` (uploader avatars), `repo/storage.db` (LokiJS database). `repo/<aid>_download/` is a transient staging folder during downloads.
- `downloader/` — external binaries (gitignored, must be provided): `lux(.exe)` from https://github.com/iawia002/lux/releases, `ffmpeg(.exe)` from https://ffmpeg.org/download.html, and `cookies.txt` (bilibili.com cookies, needed for higher-quality downloads). See `downloader/files_here.txt`.
- `chrome_extension/` — small Manifest V3 extension that injects the bilibili `SESSDATA` cookie into bilibili pages so it can be copied into `downloader/cookies.txt` (see `chrome_extension/usage.txt`).
- `B站本地下载.user.js` — Tampermonkey userscript that adds a download button on bilibili video pages and POSTs the current video to the local server at `http://localhost:8081`.
- `dist/` — build output (gitignored): webpack viewer bundles (`dist/<name>.js` + shared `dist/common.js`) and the ncc-bundled server (`dist/server/`).

## Build and run commands

Prerequisites: Node.js **>= 22.15**, plus the binaries in `downloader/` (see above).

- `npm run dev` — webpack dev server for the viewer on port 9000 (serves `static/` + bundles, hot reload, opens browser). It auto-detects the machine's LAN IPv4 and points the frontend's API root at `http://<ip>:8081/` via `webpack.DefinePlugin` (`serverConfig.apiRoot`/`repoRoot`, declared in `src/viewer/common/Server.ts`). The backend must be running separately for the UI to work.
- `npm run build` — production webpack build into `dist/` (API root becomes relative, i.e. same-origin).
- `npm run run_server` — run the backend directly with ts-node (`tsconfig.server.json`).
- `npm run build_server` — bundle the backend into `dist/server/` with `@vercel/ncc`; run it with `node dist/server/index.js`.
- The full app is served by the backend itself: `http://localhost:8081/` (static pages), `/repo/` (video files), `/dist/` (bundles).

## Code style guidelines

- TypeScript everywhere; 4-space indentation; files mostly use CRLF line endings.
- `dplayer` is pinned to exactly `1.27.0` on purpose: `src/viewer/watch/Player.ts` monkey-patches DPlayer internals (`danmaku.seek`, `danTunnel`, `options.highlight`). Never widen/upgrade this version without re-validating the patch — `_patchDanmakuSeek` self-checks the internals at runtime and skips the patch with a console error if they drift.
- `tsconfig.json` (viewer/base): `target: es6`, `module: ESNext`, `moduleResolution: bundler`, `experimentalDecorators` + `useDefineForClassFields: false` (required by Lit), `strictNullChecks: false`, `noImplicitAny: true`. `tsconfig.server.json` extends it with `module/moduleResolution: Node16` and only includes `src/common` + `src/server`.
- Lit components: class-based `LitElement` with decorators (`@customElement('kebab-case-tag')`, `@property()`), static `styles` with the `css` tag, `html` templates in `render()`. Tag names are kebab-case and usually end in `-element`; class names are PascalCase.
- Data flow is one-way: a component must never assign to properties passed in from a parent (no `this.someProp.field = ...`, no pushing into a prop array, no mutating props in `render()`). Children request changes via callback properties/events (e.g. `onSaved`, `onChange`); the owner updates its own state and passes new values down. For stale async responses, use `LatestRequest` from `src/viewer/common/LatestRequest.ts`.
- API changes: add/modify the endpoint **once** in `src/common/api/Api.ts` (`RawApis`), then register the handler in `src/server/webserver.ts` via `ServerApis.X.serve(...)` and call it from the viewer via the same `RawApis` object (through `ClientApi.ts`). Do not hand-write fetch URLs in the viewer. (Exception: `GET /download/status/stream` in `webserver.ts` is a raw Server-Sent Events endpoint feeding the download page, since SSE does not fit the single-JSON-response `RawApis` model.)
- CommonJS interop: server code often uses `require(...)` (express, lokijs, xml2js) alongside ES imports — this is intentional and works with both ts-node and ncc.
- Comments and log messages are mostly English; UI-facing strings are Chinese. Match the surrounding style.
- No linter/formatter is configured — there is no ESLint/Prettier config; follow existing file conventions.

## Testing instructions

There is **no test framework and no tests** in this project (no `test` script in `package.json`, no test files). Verification is done by building and exercising the app manually:

1. `npm run build` must complete without TypeScript errors (ts-loader type-checks the viewer).
2. `npm run run_server` must start and import the `repo/` library (watch the console for "import all videos!").
3. Manually check affected pages at `http://localhost:8081/` (or via `npm run dev` on port 9000).

If you add behavior, keep it consistent with this manual-verification model; do not add a test framework unless asked.

## Security and data-safety considerations

- `downloader/cookies.txt` contains bilibili session cookies (including `SESSDATA`) — **never commit it** (it is gitignored) and never log its contents. `UpdateCookie` (`POST /download/cookie`) overwrites this file.
- The server has **no authentication** and enables CORS for all origins; it is meant for localhost / trusted LAN use only. Do not expose port 8081 to the internet. Several endpoints mutate state over plain GET (e.g. `/download/add/:aid`, `/api/playlist/remove/:pid`) — be aware of CSRF-style triggering if the port is reachable.
- Destructive operations to be careful with: `Storage.reimportAllVideos()` wipes all DB tables and re-imports from disk; `Redownload` (`/download/redownload/:aid`) deletes `pN.mp4` files from the repo folder; the download queue can kill in-flight `lux` processes.
- `repo/` and `dist/` are gitignored build/data artifacts — never hand-edit files under `dist/`.
- Downloaded content is served statically from `/repo/`; paths come from internal ids, but keep it that way — don't introduce user-controlled path segments.
