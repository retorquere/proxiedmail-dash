# ProxiedMail PWA Agent Notes

## Project identity

- This repo already contains the active app. Do not scaffold a new project.
- App root is this repository.
- Backend/OpenAPI reference assembled from the legacy frontend: `proxiedmail.yaml` in this repo root.

## Stack

- SvelteKit + TypeScript + Svelte 5
- Static build via `@sveltejs/adapter-static` with `fallback: '200.html'`
- PWA via `vite-plugin-pwa`
- Local built-app server and reverse proxy in `server.js`

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Check: `npm run check`
- Build: `npm run build`
- Preview: `npm run preview`
- Build and serve with proxy: `npm run serve`
- Serve existing build: `HOST=127.0.0.1 PORT=3100 npm run start`

## Proxying

- In dev, Vite proxies `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`
- In built mode, `server.js` serves the app and proxies `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`

## Auth flow

- Login starts with `/api/v1/auth`
- Use the returned bearer token for authenticated requests
- `/api/v1/api-token` is optional; do not make login depend on it succeeding
- Error handling in `src/lib/proxiedmail.ts` should prefer backend message fields and then fall back to status-based messages like `Unauthorized`

## Main files

- App shell and top-level product wording: `src/routes/+layout.svelte`
- Signed-out auth screen: `src/routes/+page.svelte`
- Core API client and normalization: `src/lib/proxiedmail.ts`
- Central state and actions: `src/lib/workspace.ts`
- Proxy management screen: `src/routes/workspace/+page.svelte`
- Tools screen: `src/routes/tools/+page.svelte`

## Product terminology

- Prefer `Proxies` as the main user-facing term
- Do not use `Workspace` or `Aliases` as the primary product label
- Checkbox label in proxy creation should stay `Store received emails`
- Related status/section wording should use `Stored emails`, not `Browsable inbox`
- Avoid template-like or explanatory product copy; keep labels direct and product-specific

## Current UI decisions

- Signed-out auth is a two-tab screen: `Sign in` and `Create account`
- Create-account flow includes password confirmation
- Sidebar account card is labeled `Account`; avoid redundant status text like `Connected`
- Tools page copy was intentionally simplified to direct labels and descriptions

## Known intent

- Preserve functionality from the legacy product, but do not copy the old screen grouping or legacy HTML/CSS
- Keep terminology and UI copy concrete and consistent
