# ProxiedMail PWA

This is an SvelteKit PWA dashboard for ProxiedMail.

## Install

```sh
npm install
```

## Development

Start the Vite development server:

```sh
npm run dev
```

During development, Vite proxies `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`, so the app can call the backend without browser CORS issues.

## Checks

Run the Svelte and TypeScript checks with:

```sh
npm run check
```

## Build

Create the production build with:

```sh
npm run build
```

You can preview the built app with:

```sh
npm run preview
```

## Local proxy server

To serve the built app and proxy backend requests to `https://proxiedmail.com`:

```sh
npm run serve
```

If the app is already built, start only the local server with:

```sh
npm run start
```

The local server listens on `http://127.0.0.1:3000` by default and forwards `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`.

You can override the bind address and port with `HOST` and `PORT`, for example:

```sh
HOST=127.0.0.1 PORT=3100 npm run start
```
