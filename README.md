# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.3 create --template minimal --types ts --no-install proxiedmail-pwa
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

During development, Vite proxies `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`, so the app can use the same-origin API paths without browser CORS issues.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Running with the local proxy

To serve the built PWA and proxy backend requests to `https://proxiedmail.com`, use:

```sh
npm run serve
```

If you already built the app, you can start only the server with:

```sh
npm run start
```

The server listens on `http://127.0.0.1:3000` by default and forwards requests for `/api/v1/*` and `/gapi/*` to `https://proxiedmail.com`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
