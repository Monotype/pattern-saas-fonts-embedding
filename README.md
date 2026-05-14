# pattern-saas-fonts-embedding

> Server-controlled font delivery for SaaS applications.

This repository demonstrates the correct pattern for serving licensed fonts in a SaaS architecture. An Express server controls all font delivery through a dedicated endpoint — fonts never enter the client bundle and are never fetched from an uncontrolled CDN.

## What this pattern demonstrates

- An Express server (`server/`) that serves font files from a controlled endpoint with scoped CORS headers
- A client (`client/`) that loads fonts via `@font-face` pointing to the server endpoint
- A **subset** `.woff2` checked in under `fonts/` so CI succeeds without secrets (replace with your own licensed files for forks or private use)
- How server-side delivery keeps font assets and licensing obligations under the operator’s control

## Why server-controlled delivery is the license-safe approach

In a SaaS product, end users interact with fonts rendered by your application — constituting font access that requires server or app licensing. Delivering fonts from your own server endpoint (rather than a public CDN or client bundle) keeps delivery within your licensed infrastructure and allows you to enforce access controls, scope delivery to known origins, and maintain audit visibility.

## Canonical assertions implemented

This pattern implements the following assertions from [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation):

- `pc-004` — web apps and SaaS products require server-level licensing
- `pc-008` — self-hosting web fonts requires a web font license
- `pc-009` — in a self-hosted model, Monotype provides the licensing and governance layer; customer infrastructure handles delivery
- `pc-010` — cross-origin font delivery requires CORS configuration; missing headers cause silent font blocking
- `pc-012` — some Monotype web font licenses require a tracking script alongside self-hosted font files; this font endpoint handles delivery only—load any required tracking from the client app (for example a script tag in `client/index.html`) when your license mandates it

## Usage

1. Obtain font files under a valid Monotype web font license (this repo ships a **small subset** for build/CI; use your own files in forks or production)
2. Place `.woff2` files in `fonts/` and update the filename in `server/index.js` and the URL in `client/fonts.css` to match
3. Run the font server and client from two terminals:

```bash
# Terminal 1 — font server (default ALLOWED_ORIGIN: http://localhost:5173)
npm install
npm start

# Terminal 2 — static client server
npx serve client --listen 5173
```

4. Visit `http://localhost:5173` in a browser

**CI / local smoke:** Run **`npm test`** after **`npm install`**. It starts the font server briefly, retries until `GET /fonts/myfont` succeeds, asserts **`Access-Control-Allow-Origin`**, **`Vary`**, **`Cache-Control`**, and that **`X-Powered-By`** is not sent, then stops the server (same behavior as GitHub Actions).

This two-server setup is intentional — it replicates the cross-origin scenario the pattern is designed for: client and font server on different origins, with the `Access-Control-Allow-Origin` header controlling which client origins may load fonts.

To test with a different client origin or in a deployed environment:

```bash
ALLOWED_ORIGIN=https://yourapp.com npm start
```

> **Note:** Do not open `client/index.html` directly as a `file://` URL. Browsers send `Origin: null` for file-based requests, which will not match the configured allowed origin and will cause the font to be silently blocked.

## Font files

This repository includes **`fonts/MyFont.woff2`**, a heavily subsetted version of Gotham Regular, so **GitHub Actions** works out of the box. That file is licensed only for limited testing per **LICENSE** (Monotype terms) and this README’s **License** section—not for regular website use or redistribution. For your own project, replace the file and update the filename in `server/index.js` and the URL in `client/fonts.css` to match. See `fonts/placeholder.txt` for placement notes.

To commit a different binary despite `*.woff2` in `.gitignore`, use **`git add -f fonts/YourFile.woff2`** once, or add a **`!fonts/YourFile.woff2`** line after the `*.woff2` rule.

## Requirements

- Node.js 18+

## Scope and Intent

This example demonstrates where font-delivery controls belong in a SaaS architecture.
It is intentionally simplified:

- No authentication logic is shown
- No tenant binding is implemented
- CORS is scoped to a configurable origin for demonstration

In a production SaaS system, this endpoint would typically enforce:

- tenant identity
- product entitlements
- access tokens or signed URLs
- rate limits and audit logging

The demo server sets **`Vary: Origin`** alongside a reflected **`Access-Control-Allow-Origin`** so shared caches do not serve a font response with the wrong CORS to another browser origin. It also sets a short **`Cache-Control: private, max-age=300`** as a starting point; tune caching (and CDN behavior) once entitlements and privacy requirements are clear. Add a CORS **`OPTIONS`** handler only if font requests stop being “simple” (for example if you add custom headers on authenticated font fetches).

## Related patterns

- [pattern-nextjs-webfonts](https://github.com/Monotype/pattern-nextjs-webfonts) — Next.js build-time font loading via `next/font/local`
- [pattern-react-webfonts](https://github.com/Monotype/pattern-react-webfonts) — React component library with CSS variable delivery
- [pattern-cicd-fonts-usage](https://github.com/Monotype/pattern-cicd-fonts-usage) — CI/CD pipeline font management
- [pattern-variable-fonts-usage](https://github.com/Monotype/pattern-variable-fonts-usage) — variable font axes via CSS

## Support

Use GitHub Discussions (Q&A category) for questions about this pattern.

## License

Sample application code in this repository is licensed under the MIT License. The subset font file in fonts/ is included only as a build/CI demonstration asset and licensed for limited testing purposes only; it is not licensed for regular use on websites or redistribution. Please refer to the LICENSE file in the repository for both licenses. Canonical assertion text in [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation) remains subject to that repository’s terms.
