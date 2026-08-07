# Ghostty Theme Changer — project guide

A local web app to browse, build, and **live-preview** Ghostty terminal themes. It is a rewrite of
`github.com/pentolati/GhosttyThemeChangerWithoutReload` that **drops Electron**: a tiny Node/Fastify
server serves a React UI to the user's own browser and does the file work (read themes, write config,
signal Ghostty). No Chromium is bundled.

## Architecture at a glance

```
Browser (React UI)  ──HTTP /api──▶  Node/Fastify server  ──fs / signals──▶  Ghostty config + process
      src/                              server/                              ~/.config or ~/Library/…
```

The migration mental model: **Electron main process → Fastify server**, and
**`window.ghosttyApi.*` IPC → `fetch('/api/…')`**. All the original file logic (pure Node) moved into
`server/ghostty/*` almost verbatim.

## Layout

- `server/index.cjs` — Fastify app: serves `dist/`, mounts `/api/*`, binds `127.0.0.1`, injects a
  per-launch token into the served HTML and requires it on `/api` (Host-header checked too), opens the
  browser, picks a free port (default 4177, `EADDRINUSE` fallback).
- `server/ghostty/` — the "brain" (CommonJS, testable in isolation):
  - `paths.cjs` — resolves the **active** config path + theme dirs per platform (see gotchas).
  - `core.cjs` — read-only: `collectThemes`, `readState`, `parseThemeFile`, `luminance`, `parseThemeLine`.
  - `config-io.cjs` — write primitives: `readLines`/`writeLines`, `backupConfig`+`rotateBackups`,
    `stripThemeLines`, `stripManagedBlock`, `trimTrailingBlank`, `timestamp`.
  - `overrides.cjs` — color ↔ Ghostty-config serialization: `normHex`, `themeLines` (full),
    `overrideLines` (only diffs vs a base).
  - `custom.cjs` — user theme files: `writeCustomTheme` / `editCustomTheme` / `readCustomThemeRaw` /
    `deleteCustomTheme` (name-sanitized; edit backups go to a `.gtc-backups/` subdir, not the theme list).
  - `apply.cjs` — commit a preset (`theme = …` single or `light:A,dark:B`).
  - `preview.cjs` — live-preview session machine (start/update/commit/cancel/status/resolveOrphaned).
  - `fonts.cjs` — enumerate families (`ghostty +list-fonts` via the resolved app binary) and write
    the primary `font-family` + `font-size` (global keys, not part of a theme).
  - `reload.cjs` — the swappable "reload Ghostty" trigger.
- `server/routes/` — `themes.cjs`, `custom.cjs`, `preview.cjs`, `fonts.cjs` (thin Fastify plugins).
- `src/` — React app (Vite + Chakra UI + Zustand):
  - `api.js` — fetch wrapper (sends the launch token). Replaces the old preload bridge.
  - `store.js` — Zustand store. Theme list/apply state **and** the editor/preview slice.
  - `App.jsx` — layout, grid, top bar, the orphan-recovery banner, and the editor toggle.
  - `components/TerminalPreview.jsx` — the mock-terminal renderer, shared by cards (`sm`) and the
    editor (`lg`). Takes `t = { background, foreground, cursor, selBg, selFg, palette[16] }`.
  - `components/ThemeCard.jsx`, `Sidebar.jsx`, `InfoTip.jsx`, `Typography.jsx` (font family/size,
    lives in the sidebar; store-connected).
  - `components/editor/` — `ThemeEditor`, `ColorSlot`, `ColorPickerPopover` (react-colorful),
    `PaletteGrid`, `ContrastReadout`, `EditorPreviewPane`.
  - `theme/tokens.js` (design tokens + `contrast`/`luminance`), `theme/chakraTheme.js`.

## Run / build / test

- `npm run app` — build UI + start server + open browser (production-style).
- `npm run dev` — Vite (HMR) + API server together; Vite proxies `/api` → `127.0.0.1:4177`.
- `npm run build` / `./start.sh` — build; launcher.
- No test runner is configured. Verify backend modules **hermetically** with a throwaway `$HOME` and
  `GTC_NO_RELOAD=1` so the user's real config and terminal are never touched, e.g.:
  ```bash
  env -u XDG_CONFIG_HOME HOME=$(mktemp -d) GTC_NO_RELOAD=1 node -e "require('./server/ghostty/apply.cjs')…"
  ```

## Env vars (all optional)

- `GTC_PORT` (default 4177), `GTC_NO_OPEN` (don't open browser), `GTC_DEV` (relax the API token —
  set by `npm run dev` so the Vite-served page works), `GTC_NO_RELOAD` (never signal Ghostty — for tests),
  `GHOSTTY_RESOURCES_DIR` (override built-in themes dir), `XDG_CONFIG_HOME`.

## Conventions

- Server is **CommonJS** (`.cjs`) so `server/ghostty/*` ports the original Node logic without a build
  step. Frontend is ESM/JSX via Vite. Don't introduce a TS build for the server.
- Some identifiers/comments are Indonesian, inherited from the original (`bawaan` = built-in,
  `buatan` = user-made, `cadangan` = backup, `pilih` = pick). The frontend checks `t.source === 'buatan'`
  / `'bawaan'` — keep those literals.
- Every config mutation goes through `config-io` primitives so backups/rotation stay consistent.
- The editor draft/color shape is `{ background, foreground, cursor, selBg, selFg, palette[16] }`
  everywhere (matches `parseThemeFile` and `TerminalPreview`).

## Gotchas we learned the hard way

- **Config path (macOS).** Ghostty reads `~/Library/Application Support/com.mitchellh.ghostty/config`
  (and `config.ghostty`) **and** the XDG `~/.config/ghostty/config`, with AppSupport winning on conflict.
  `paths.resolveConfigPath()` picks the highest-precedence **existing** file (never hardcode the XDG path).
- **Reload signal (macOS).** On macOS the process "name" is the full path
  `/Applications/Ghostty.app/Contents/MacOS/ghostty`, so `pkill -x ghostty` matches **nothing**.
  `reload.cjs` instead lists `ps -axo pid=,comm=`, matches processes whose **basename** is `ghostty`,
  and sends `SIGUSR2` via `process.kill`. (SIGUSR2 config-reload requires Ghostty ≥ 1.2.0.)
- **Safe live preview.** Never rewrite the real config on every slider drag. `preview.cjs` adds ONE
  sentinel-wrapped optional include (`config-file = ?themechanger-preview.ghostty`) once, then only
  rewrites that throwaway file. Cancel restores byte-for-byte; commit bakes it in + removes the include;
  a crash leaves the sentinel, which `status()` reports as `orphaned` for a Keep/Discard prompt.
- **Per-color overrides beat the theme** regardless of line order (`theme = X` loads first, explicit
  color keys override). `overrideLines` writes only the changed keys on the "apply" path.
- **Raw vs filled palette.** `collectThemes` fills missing palette slots for previews; when editing a
  custom theme, seed the draft from the **raw** file (`readCustomThemeRaw`) so synthetic fills aren't saved.
- **Backup timestamps** include milliseconds so rapid successive applies don't collide onto one file.
- **`ghostty` CLI often isn't on PATH** for a GUI-launched server. `fonts.ghosttyBin()` resolves the
  app binary (`/Applications/Ghostty.app/Contents/MacOS/ghostty`, or `$GHOSTTY_BIN`) before calling
  `+list-fonts`. `+list-fonts` lists monospace families and has no `--plain` flag.
- **font-size reload** applies to already-open windows only on Ghostty ≥ 1.2.1, and not to windows the
  user manually zoomed (⌘0 resets those). `font-family` reloads live on ≥ 1.2.0.

## Security

Localhost-only bind + per-launch token in the HTML + Host-header check + no permissive CORS. This
matters because a local server that writes config and signals processes would otherwise be reachable
by any web page open in the same browser (CSRF / DNS-rebinding). Keep these guards intact.
