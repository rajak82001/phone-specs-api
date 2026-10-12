# Agent Context: Phone Specs API

This document is a verified handoff guide for an AI coding agent or a new contributor working in this repository. It describes the code that is currently here; it does not assume that the older upstream API documentation matches this implementation.

## Project Summary

This is a Node.js and Express API that scrapes phone and brand information from the website configured by `BASE_URL`, parses the returned HTML with Cheerio, and returns JSON responses. Search uses Puppeteer. The app also initializes a MongoDB connection through Mongoose, and includes Brand and Specs schemas, although the current request handlers do not use those models to serve responses.

## Repository File Map

| File | Purpose |
| --- | --- |
| `index.js` | Application entry point. Loads `.env`, creates the Express app, initializes the database connection, enables permissive CORS headers, mounts the API and fallback routes, and listens on `PORT` or `3002`. |
| `package.json` | Project metadata, npm scripts, and runtime/development dependencies. `npm start` runs `node index.js`; `npm run dev` runs it with Nodemon. |
| `package-lock.json` | npm dependency lockfile. Keep it in sync when npm dependencies change. |
| `yarn.lock` | Yarn dependency lockfile. Check the repository's existing package-manager workflow before changing dependencies; avoid gratuitous lockfile churn. |
| `vercel.json` | Vercel deployment configuration. Builds `index.js` with `@vercel/node` and sends incoming paths to the function. |
| `.env.example` | Environment-variable template. It currently lists `DB_USER`, `DB_PASSWORD`, and `DB_COLLECTION`; it does not include `BASE_URL` or `PORT`. |
| `.gitignore` | Excludes `node_modules` and `.env` from Git. Do not commit real credentials. |
| `README.md` | Existing API/project README. It includes upstream API information and examples, which may not describe this repository's current deployment or source code. |
| `AGENT_CONTEXT.md` | This repository handoff and code map. |
| `src/db/connection.js` | Builds a MongoDB Atlas connection string from the DB environment variables and connects via Mongoose. Logs connection success/failure. |
| `src/routes/index.js` | Registers the root endpoint and API routes, connecting URL paths to controllers. |
| `src/routes/error.js` | Returns the standard JSON 404 response for routes not matched by the router. |
| `src/controllers/index.js` | Implements `GET /`, returning API metadata and example endpoint URLs. |
| `src/controllers/brandController.js` | Scrapes brand listings and paginated phone lists from the configured upstream site. |
| `src/controllers/specController.js` | Scrapes one phone's overview, specifications, and available images from the upstream site. |
| `src/controllers/searchController.js` | Uses Puppeteer to load the upstream search page, parses phone results with Cheerio, and returns them. |
| `src/controllers/miscController.js` | Scrapes latest phones, top-by-interest phones, and top-by-fans phones. |
| `src/models/Brand.js` | Mongoose schema/model for brand records. It is not currently referenced by the route/controller flow. |
| `src/models/Specs.js` | Mongoose schema/model for phone specification records. It is not currently referenced by the route/controller flow. |
| `src/utils/response.js` | Shared JSON response helpers: successful payloads use `{ status: true, data }`; errors use `{ status: false, error }`. |

## Current HTTP Endpoints

All paths below are registered on the local Express app. Successful controller responses are wrapped by `src/utils/response.js`.

| Method and path | Handler | Behavior |
| --- | --- | --- |
| `GET /` | `controllers/index.js` | Returns API metadata and example links. |
| `GET /brands` | `controllers/brandController.js` | Scrapes the upstream brand list. |
| `GET /brands/:slug` | `controllers/brandController.js` | Scrapes phones for a brand. Optional `?page=N` selects a page. |
| `GET /search?query=...` | `controllers/searchController.js` | Searches upstream and returns matching phones. `query` is required. |
| `GET /latest` | `controllers/miscController.js` | Returns the latest phone list. |
| `GET /top-by-interest` | `controllers/miscController.js` | Returns phones ranked by daily interest. |
| `GET /top-by-fans` | `controllers/miscController.js` | Returns phones ranked by fan/favorite count. |
| `GET /:slug` | `controllers/specController.js` | Scrapes details and specifications for a phone slug. |
| Other unmatched paths | `routes/error.js` | Returns a 404 JSON error when no earlier route matches. |

The root route's metadata and the existing `README.md` contain example URL shapes; use `src/routes/index.js` as the source of truth for what this code actually registers.

## Local Setup

Prerequisites: Node.js/npm, access to the configured upstream scraping site, and MongoDB credentials if the database connection is required.

1. Install dependencies with `npm install`.
2. Create a local `.env` based on `.env.example` and set `DB_USER`, `DB_PASSWORD`, `DB_COLLECTION`, and `BASE_URL`. `PORT` is optional and defaults to `3002`.
3. Start the API with `npm start`, or use `npm run dev` during development.
4. Check `GET /` on the selected port for the endpoint metadata.

`BASE_URL` is read by the scraping controllers but is missing from the checked-in `.env.example`; add it to the real environment. Do not put secrets in this document or commit `.env`.

## Request and Data Flow

1. `index.js` loads environment variables and initializes Express and the Mongoose connection.
2. CORS headers are set for every request.
3. `src/routes/index.js` dispatches each endpoint to its controller.
4. Controllers request upstream HTML (Puppeteer for search, `request-promise` for the other scraping paths), parse it with Cheerio, and construct response objects.
5. `src/utils/response.js` formats successful and error JSON responses.

Despite the presence of Mongoose models and a database connection, the current controllers scrape on demand; do not assume the API reads from or writes to MongoDB without confirming a code change.

## Agent Working Notes

- Read the owning controller and its route before changing endpoint behavior. Keep response field names and the `{ status, data }` / `{ status, error }` envelope compatible unless the task explicitly changes the API contract.
- Treat the upstream website's HTML structure as an external dependency. Selectors, URL patterns, and pagination parsing can break when that site changes; verify against realistic HTML or a live response where feasible.
- Scraping calls depend on `BASE_URL` and network access. Tests that require the live site may be flaky; prefer isolated tests with representative HTML when adding coverage.
- Search launches a headless browser, so runtime/deployment environments must support Puppeteer/Chromium. Ensure the browser is closed on both success and failure if modifying this flow.
- `specController.js` currently stores scrape output and some parsed values in module-level variables, and assigns some values without declarations. This can leak/mix state across concurrent requests. Address this carefully if touching the scraper; do not use shared mutable request state.
- The `topFans` handler currently labels its response title as `Top By Daily Interest`, although it reads the fans table. Confirm expected API compatibility before correcting the label.
- `errorJson` defaults to HTTP 500; route-not-found explicitly passes 404. Preserve intentional status codes when updating error handling.
- CORS currently allows any origin and lists GET, POST, PATCH, and DELETE, although the registered API routes are GET-only. Do not broaden route behavior or alter CORS policy without a requirement.
- No test script or test files are currently declared in `package.json`. If adding tests, use a focused test setup and document/run the relevant command.
- Do not copy upstream API claims from `README.md` into code assumptions without checking the local routes and controllers.

## Verification Checklist For Changes

- Confirm the route still maps to the intended controller in `src/routes/index.js`.
- Check successful and error response shape and HTTP status.
- For scraper changes, verify expected HTML selectors, absent fields, and upstream request failures.
- For phone detail scraping, ensure separate requests cannot share state.
- Run the narrowest relevant tests or syntax checks; report clearly if no tests exist or external network/configuration prevents validation.