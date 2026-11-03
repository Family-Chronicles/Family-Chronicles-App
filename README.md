# Family-Chronicles-App

Web app for [Family Chronicles](https://github.com/Family-Chronicles/Family-Chronicles-Server) – manage persons,
families, relationships, pictures and documents, and browse the family tree.

## Tech stack

- [Svelte 5](https://svelte.dev) for components and rendering
- [bQuery.js](https://bquery.js.org) for state (signals), HTTP client, hash routing, translations (i18n) and screen reader announcements
- TypeScript, [Tailwind CSS 4](https://tailwindcss.com), Vite

bQuery signals are bridged into Svelte stores with `fromSignal()` (`src/lib/state/svelte.ts`),
so components can use `$store` syntax on bQuery state.

## Getting started

The app needs a running Family Chronicles server. Without Docker or MongoDB you can start one in memory:

```bash
# in Family-Chronicles-Server
npm install
npm run dev          # admin: admin@family-chronicles.local / admin12345
```

Then start the app:

```bash
npm install
npm run dev          # http://localhost:5173, /api is proxied to http://localhost:8080
```

## Scripts

| Command            | Description                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Dev server with API proxy                          |
| `npm run build`    | Production build to `dist/`                        |
| `npm run check`    | Type check (svelte-check)                          |
| `npm test`         | Unit tests (Vitest)                                |
| `npm run test:e2e` | End-to-end tests (Playwright, starts server + app) |
| `npm run format`   | Format with Prettier                               |

## Configuration

| Variable           | Default                 | Description                             |
| ------------------ | ----------------------- | --------------------------------------- |
| `VITE_API_URL`     | `/api/v1`               | API base URL used by the built app      |
| `API_PROXY_TARGET` | `http://localhost:8080` | Target of the dev proxy (`npm run dev`) |

## Docker

Complete stack (app, server, MongoDB) with the server repository next to this one:

```bash
cp .env.example .env   # set JWT_SECRET and ADMIN_PASSWORD
docker compose up --build
```

The app is then available at http://localhost:8000. `Dockerfile` builds the app and serves it with nginx,
which forwards `/api` (including the live WebSocket) to the `family-chronicles-server` container (see `nginx.conf`).

## End-to-end tests

`npm run test:e2e` starts the server (in memory mode, from `../Family-Chronicles-Server` or `SERVER_DIR`)
and the dev server, then runs the Playwright tests in `e2e/`. Run `npx playwright install chromium` once.

## Features

- Login with roles: viewers read, editors edit, admins also manage users
- Persons with first, middle and last names, birth name, birth/death dates and places, cause of death
- Partial dates (`1901`, `04.1901`, `12.04.1901`)
- Relationships (parents, children, partners, siblings, …) with role, start and end date
- Families with members, roles and periods; surnames derived from the members
- Pictures, videos, audio, documents and texts per person; tag persons on images
- Family tree: ancestors and descendants
- GEDCOM import and export (Editor)
- Live updates: changes made by others appear without reloading
- German and English, chosen language is remembered
- Life events (baptism, occupation, residence, …) and sources per person
- Paged person list with server-side search
- Login stays valid with automatically renewed tokens; "forgot password" by email (if the server has SMTP)
- Federation (admins): connect other instances, link persons to persons there
