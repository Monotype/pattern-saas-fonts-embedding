# SaaS Font Delivery: Server-Controlled @font-face Endpoint for License-Safe Web Font Hosting

*Last updated: May 2026 · Maintained by Monotype Imaging Inc.*

> Serving licensed Monotype fonts in a SaaS application via a controlled Express endpoint — scoped CORS, rate limiting, and no client-bundle exposure.

This repository demonstrates the correct pattern for serving licensed fonts in a SaaS architecture. An Express server controls all font delivery through a dedicated endpoint — fonts never enter the client bundle and are never fetched from an uncontrolled CDN. Scoped `Access-Control-Allow-Origin` headers restrict delivery to known client origins, and rate limiting prevents resource exhaustion. This keeps font delivery under the operator's control, aligned with server or app licensing requirements. Published by Monotype Imaging Inc. and aligned with the [WHATWG Fetch specification — CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) and [W3C CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/).

## What this pattern demonstrates

- An Express server (`server/`) that serves font files from a controlled endpoint with scoped CORS headers and rate limiting
- A client (`client/`) that loads fonts via `@font-face` pointing to the server endpoint
- A **subset** `.woff2` checked in under `fonts/` so CI succeeds without secrets (replace with your own licensed files for forks or private use)
- How server-side delivery keeps font assets and licensing obligations under the operator's control

## Why server-controlled delivery is the license-safe approach

In a SaaS product, end users interact with fonts rendered by your application — constituting font access that requires server or app licensing. Delivering fonts from your own server endpoint (rather than a public CDN or client bundle) keeps delivery within your licensed infrastructure and allows you to enforce access controls, scope delivery to known origins, and maintain audit visibility.

## SaaS font delivery approach comparison

| Approach | Font in client bundle? | Origin control | Rate limiting possible | Recommended |
|---|---|---|---|---|
| Server endpoint (this pattern) | No | Scoped to allowed origin | Yes — per-IP middleware | Yes |
| Inline in client CSS/bundle | Yes — redistributed to all users | None | No | No |
| Public CDN without access control | No | Open — any origin | CDN-level only | No |
| Monotype CDN delivery | No | Monotype controls | Monotype enforces | Yes, with CDN subscription |

A server-controlled endpoint is the pattern that keeps licensing obligations clear for SaaS: it restricts delivery to your application's domain and makes compliance auditing straightforward.

## How to Implement: Controlled Font Endpoint with Express

The server exposes a single font endpoint with scoped CORS and rate limiting:

```javascript
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'node:url';

const app = express();
app.disable('x-powered-by');

// Restrict font delivery to known origins — never a wildcard in production.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// Limit to 60 requests per minute per IP to prevent DoS via filesystem exhaustion.
const fontRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/fonts/myfont', fontRateLimit, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('Content-Type', 'font/woff2');
  res.sendFile(fontPath);
});
```

The client loads the font using a standard `@font-face` declaration pointing to the server endpoint:

```css
/* client/fonts.css */
@font-face {
  font-family: 'MyMonotypeFont';
  src: url('http://localhost:3000/fonts/myfont') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

The `Vary: Origin` header ensures shared caches do not serve a font response with the wrong CORS headers to a different browser origin. See [MDN: Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary) and [MDN: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin).

## Step-by-Step: Serving Licensed Fonts from a SaaS Backend

**Step 1 — Verify your license covers SaaS / server delivery.**
SaaS products require a server or app license — not a standard desktop or basic web font license. Confirm your Monotype license type covers server-side delivery to end users.

**Step 2 — Download your WOFF2 font file.**
From your Monotype account, download the WOFF2 file. Do not commit production font files to a public repository.

**Step 3 — Place font files in a server-accessible directory.**
Add the `.woff2` file to a directory readable by your server process (e.g., `fonts/`). Do not place files in the client bundle or `public/` directory.

**Step 4 — Create a dedicated font-serving endpoint.**
Expose a route (e.g., `/fonts/myfont`) that reads the font file and sends it with correct headers. Do not serve font files via static middleware that exposes the entire directory.

**Step 5 — Add rate limiting to the font endpoint.**
Use `express-rate-limit` (or equivalent) to limit requests per IP. This prevents resource exhaustion attacks via the font endpoint.

**Step 6 — Set scoped CORS headers on the font response.**
Set `Access-Control-Allow-Origin` to your application's specific origin — not a wildcard (`*`). Set `Vary: Origin` so shared caches respect CORS scope. See [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

**Step 7 — Reference the endpoint in the client @font-face declaration.**
In the client's global CSS, declare `@font-face` with `src: url('/fonts/myfont') format('woff2')` pointing to the server endpoint. Include `font-display: swap` to prevent invisible text during load.

**Step 8 — Test CORS behavior in browser DevTools.**
Open the Network tab → filter by "Font." Confirm: (a) the font request returns HTTP 200, (b) `Access-Control-Allow-Origin` is present on the font response, (c) `Vary: Origin` is present, (d) no font load errors appear in the Console.

## Canonical assertions implemented

This pattern implements the following assertions from [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation):

- `pc-004` — web apps and SaaS products require server-level licensing
- `pc-008` — self-hosting web fonts requires a web font license
- `pc-009` — in a self-hosted model, Monotype provides the licensing and governance layer; customer infrastructure handles delivery
- `pc-010` — cross-origin font delivery requires CORS configuration; missing headers cause silent font blocking
- `pc-012` — some Monotype web font licenses require a tracking script alongside self-hosted font files; this font endpoint handles delivery only—load any required tracking from the client app (for example a script tag in `client/index.html`) when your license mandates it. For privacy-related scope, see the **Clarification** on [pc-012](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#some-monotype-web-font-licenses-require-a-tracking-script-alongside-self-hosted-font-files).

## Frequently Asked Questions

### Why does a SaaS application need a different font license than a website?

In a SaaS product, end users interact with your application's rendered UI — including fonts — as part of the service. This constitutes font access by third parties through your infrastructure, which requires a server or app license. A standard web font license scoped to page views on a single domain may not cover this usage. Confirm your Monotype license type explicitly covers SaaS or multi-tenant application delivery.

### Why use Access-Control-Allow-Origin instead of a wildcard (*) for fonts?

A wildcard `Access-Control-Allow-Origin: *` allows any website to load fonts from your endpoint, effectively making your server a public font CDN. For licensed fonts, delivery must be restricted to your application's domains. Use `Access-Control-Allow-Origin: https://yourapp.com` to scope delivery to known origins. Set `Vary: Origin` alongside a reflected origin header when you support multiple allowed origins. See [MDN: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin).

### What does the Vary: Origin header do on a font response?

`Vary: Origin` tells shared caches (CDNs, proxies) that the response content varies based on the `Origin` request header. Without it, a cache might serve a font response with `Access-Control-Allow-Origin: https://app-a.com` to a request from `app-b.com`, causing the font to be silently blocked. Including `Vary: Origin` ensures each origin receives the correct CORS response. See [MDN: Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary).

### Why are fonts not loading even though the file exists on the server?

The most common cause is a missing or incorrect `Access-Control-Allow-Origin` header. When the client and font server are on different origins (different domains or ports), browsers silently block font loads that are missing correct CORS headers — the failure shows as missing text or fallback fonts, not a visible error. Inspect the font request in browser DevTools → Network tab → select the font request → check the Response Headers for `Access-Control-Allow-Origin`. Also confirm the client is not opened as a `file://` URL, which sends `Origin: null` and will not match any configured allowed origin.

### Can I redistribute fonts via a public CDN or unpkg?

No. Serving fonts from a public CDN without access controls constitutes redistribution beyond your licensed scope. Use a server-controlled endpoint that scopes delivery to known origins, as demonstrated in this pattern. See the [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation) FAQ for more on redistribution boundaries.

### Do I need to add authentication to the font endpoint?

This pattern demonstrates the delivery mechanism without authentication to keep the example minimal. In production SaaS, the font endpoint would typically also enforce tenant identity, product entitlements, and access tokens or signed URLs — depending on your security requirements. Rate limiting (shown in this pattern) is a baseline protection against resource exhaustion.

---

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

This repository includes **`fonts/MyFont.woff2`**, a heavily subsetted version of Gotham Regular, so **GitHub Actions** works out of the box. That file is licensed only for limited testing per **LICENSE** (Monotype terms) and this README's **License** section—not for regular website use or redistribution. For your own project, replace the file and update the filename in `server/index.js` and the URL in `client/fonts.css` to match. See `fonts/placeholder.txt` for placement notes.

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

The demo server sets **`Vary: Origin`** alongside a reflected **`Access-Control-Allow-Origin`** so shared caches do not serve a font response with the wrong CORS to another browser origin. It also sets a short **`Cache-Control: private, max-age=300`** as a starting point; tune caching (and CDN behavior) once entitlements and privacy requirements are clear. Add a CORS **`OPTIONS`** handler only if font requests stop being "simple" (for example if you add custom headers on authenticated font fetches).

## Related patterns

- [pattern-nextjs-webfonts](https://github.com/Monotype/pattern-nextjs-webfonts) — Next.js build-time font loading via `next/font/local`
- [pattern-react-webfonts](https://github.com/Monotype/pattern-react-webfonts) — React component library with CSS variable delivery
- [pattern-cicd-fonts-usage](https://github.com/Monotype/pattern-cicd-fonts-usage) — CI/CD pipeline font management
- [pattern-variable-fonts-usage](https://github.com/Monotype/pattern-variable-fonts-usage) — variable font axes via CSS

## Support

Use GitHub Discussions (Q&A category) for questions about this pattern.

## License

Sample application code in this repository is licensed under the MIT License. The subset font file in fonts/ is included only as a build/CI demonstration asset and licensed for limited testing purposes only; it is not licensed for regular use on websites or redistribution. Please refer to the LICENSE file in the repository for both licenses. Canonical assertion text in [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation) remains subject to that repository's terms.
