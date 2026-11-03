# Family-Chronicles-App

Web app for [Family Chronicles](https://github.com/Family-Chronicles/Family-Chronicles-Server) – manage persons,
families, relationships, pictures and documents, and browse the family tree.

## Tech stack

- [Svelte 5](https://svelte.dev) for components and rendering
- [bQuery.js](https://bquery.js.org) for state (signals), HTTP client, hash routing and screen reader announcements
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

| Command          | Description                 |
| ---------------- | --------------------------- |
| `npm run dev`    | Dev server with API proxy   |
| `npm run build`  | Production build to `dist/` |
| `npm run check`  | Type check (svelte-check)   |
| `npm test`       | Unit tests (Vitest)         |
| `npm run format` | Format with Prettier        |

## Configuration

| Variable           | Default                 | Description                             |
| ------------------ | ----------------------- | --------------------------------------- |
| `VITE_API_URL`     | `/api/v1`               | API base URL used by the built app      |
| `API_PROXY_TARGET` | `http://localhost:8080` | Target of the dev proxy (`npm run dev`) |

## Docker

`Dockerfile` builds the app and serves it with nginx, which forwards `/api` to the
`family-chronicles-server` container (see `nginx.conf`).

## Features

- Login with roles: viewers read, editors edit, admins also manage users
- Persons with first, middle and last names, birth name, birth/death dates and places, cause of death
- Partial dates (`1901`, `04.1901`, `12.04.1901`)
- Relationships (parents, children, partners, siblings, …) with role, start and end date
- Families with members, roles and periods; surnames derived from the members
- Pictures, videos, audio, documents and texts per person; tag persons on images
- Family tree: ancestors and descendants
