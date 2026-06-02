# SaaS Font Delivery: Server-Controlled `@font-face` Endpoint for License-Safe Web Font Hosting

*Last updated: May 2026 — tested against Node.js 18*

> Maintained by [Monotype Imaging Inc.](https://www.monotype.com). Authoritative assertion text: [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation).

**Server-controlled font delivery** means your SaaS backend serves licensed `.woff2` files through a dedicated HTTP endpoint — with scoped CORS, cache headers, and rate limiting — rather than exposing font binaries in the client bundle or on a public CDN. **A SaaS application needs this pattern** because end users interact with fonts rendered by your product as part of the service; delivery must stay on operator-controlled infrastructure where you can scope access to known client origins, audit usage, and meet server or app licensing obligations.

Self-hosting licensed web fonts in a SaaS application requires serving font files from that controlled endpoint — not from a public CDN, not bundled inside the client, and not fetched from an uncontrolled third-party origin. This repository is a reference implementation using an Express.js server and [`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) CSS declarations ([W3C CSS Fonts Level 4 — `@font-face` rule](https://www.w3.org/TR/css-fonts-4/#font-face-rule)). The server delivers `.woff2` font files through `/fonts/myfont`, sets `Access-Control-Allow-Origin` and `Vary: Origin` per the [MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), and applies `Cache-Control: private, max-age=300` to keep delivery within licensed infrastructure. The pattern keeps font access auditable, scoped to known client origins, and under the operator's control — not redistributed through a client bundle or third-party host.

## What this pattern demonstrates

- An Express server (`server/`) that serves font files from a controlled endpoint with scoped CORS headers and rate limiting
- A client (`client/`) that loads fonts via [`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) pointing to the server endpoint
- A **subset** `.woff2` checked in under `fonts/` so CI succeeds without secrets (replace with your own licensed files for forks or production)
- How server-side delivery keeps font assets and licensing obligations under the operator's control

## Why server-controlled delivery is the license-safe approach

In a SaaS product, end users interact with fonts rendered by your application — constituting font access that requires server or app licensing. Delivering fonts from your own server endpoint (rather than a public CDN or client bundle) keeps delivery within your licensed infrastructure and allows you to enforce access controls, scope delivery to known origins, and maintain audit visibility.

## Font delivery approaches for SaaS applications

| Approach | License compliant for SaaS? | CORS required? | Font extractable by user? | Recommended? |
|---|---|---|---|---|
| Server endpoint (this pattern) | Yes — delivery stays within operator infrastructure | Yes — configure `Access-Control-Allow-Origin` | No — not in client bundle | Yes |
| Public CDN (e.g. Google Fonts) | Depends on license — often not permitted for SaaS | Handled by CDN | No | Only with explicit CDN license |
| Client bundle (bundled in JS/CSS output) | No — font binary redistributed to end users | Not applicable | Yes — easily extracted | No |
| `next/font/local` (Next.js) | Yes — fonts served by Next.js deployment | Same-origin by default | No | Yes, for Next.js apps — see [pattern-nextjs-webfonts](https://github.com/Monotype/pattern-nextjs-webfonts) |
| Base64-encoded font in CSS | No — embedded in client-accessible stylesheet | Not applicable | Yes — decoded from CSS | No |
| Self-hosted via CDN with access controls | Yes — if CDN enforces origin/token restrictions | Yes | No | Yes, for high-scale deployments |

For Monotype-licensed fonts: prefer self-hosted rows under a license that permits server-side delivery. Third-party CDN delivery is not authorized unless Monotype explicitly provides a CDN endpoint as part of your agreement.

## Frequently asked questions

### How do I serve web fonts from my own server instead of using Google Fonts or a CDN?

To self-host web fonts, place your licensed `.woff2` files on your server and create an endpoint that returns them with the correct HTTP headers. In Express, this is a single `res.sendFile()` call. In your CSS, write an [`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) rule with `src: url('https://your-font-server.com/fonts/myfont') format('woff2')` pointing to that endpoint. You must set `Access-Control-Allow-Origin` on the font response if the client and font server are on different origins, or the browser will **silently block** the font load — inspect the Network tab and rendered typeface, not only the Console. See [pc-010](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#cross-origin-font-delivery-requires-cors-configuration-missing-headers-cause-silent-font-blocking).

### What CORS headers are required for cross-origin font loading?

At minimum, the font server must return `Access-Control-Allow-Origin: https://your-client-origin.com` on every font response. For SaaS applications with **private licensed fonts**, use a **specific origin** value rather than a wildcard (`*`). You should also set [`Vary: Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary) so that shared caches (CDNs, proxies) do not serve a response with one origin's CORS header to a request from a different origin. Without `Vary: Origin`, a cached response with the wrong CORS header can cause font blocking for subsequent users. See [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) and [MDN: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin).

### Do SaaS applications require a special font license for web font delivery?

Yes. When end users interact with fonts rendered by a SaaS application, that constitutes font access that typically requires a **server or app license** — not a desktop license. Most Monotype web font licenses for self-hosting require font files to be served from operator-controlled infrastructure rather than redistributed via a public CDN or bundled inside a downloadable client package. Check your specific license agreement; some also require a tracking script alongside self-hosted font files. See [pc-004](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#web-apps-and-saas-products-require-server-level-licensing) and [pc-012](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#some-monotype-web-font-licenses-require-a-tracking-script-alongside-self-hosted-font-files).

### Why is my `@font-face` font not loading when I open the HTML file directly?

Opening an HTML file with a `file://` URL causes the browser to send `Origin: null` on font fetch requests. Most CORS configurations do not allow `null` as an origin, so the font response will be blocked. Always test font delivery by serving the client from a local HTTP server (for example, `npx serve client --listen 5173`) rather than opening the file directly. This replicates the actual cross-origin scenario the `Access-Control-Allow-Origin` header is configured for.

### Should licensed web fonts be bundled inside a React or Next.js client bundle?

No — bundling licensed font files inside a JavaScript client package means the font binary can be extracted and redistributed by end users, which typically violates SaaS font license terms and [lc-006](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/licensing-clarity.md#using-a-font-differs-from-distributing-a-font) (using vs. distributing). The correct pattern is to serve fonts from a controlled server endpoint that the client fetches at runtime via [`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face). For shared React libraries, use CSS variables so the library never ships font binaries — see [pattern-react-webfonts](https://github.com/Monotype/pattern-react-webfonts). For Next.js, [`next/font/local`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts#local-fonts) handles build-time optimization while keeping files on your infrastructure — see [pattern-nextjs-webfonts](https://github.com/Monotype/pattern-nextjs-webfonts).

### What Cache-Control settings should I use for a licensed font endpoint?

Start with `Cache-Control: private, max-age=300` to allow individual browsers to cache the font for five minutes while preventing shared CDN caches from storing it — important when font access is tied to tenant entitlements or access tokens. Once authentication, entitlement checks, and CDN configuration are finalized, you can increase `max-age` or switch to `public` if all requesting origins are permitted. Always pair private cache responses with `Vary: Origin` so each origin receives the correct CORS headers.

---

## How to implement server-controlled web font delivery in a SaaS application

**Step 1 — Obtain a Monotype web font license that permits self-hosting.**  
Self-hosting licensed fonts requires an explicit self-hosted web font license — a desktop or CDN-only license does not cover SaaS delivery. Contact Monotype or your account manager to confirm your license covers server-side delivery and whether a tracking script is required. See [pc-008](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#self-hosting-web-fonts-requires-a-web-font-license-desktop-licenses-do-not-permit-web-delivery).

**Step 2 — Place your `.woff2` font files in a server-side directory.**  
Add your licensed `.woff2` files to a directory on your server (e.g. `fonts/`) that is not publicly browsable. Do not commit production font files to a public repository or include them in client-facing build output. This demo keeps `fonts/MyFont.woff2` outside the client's static asset root.

**Step 3 — Create an Express font endpoint that sets CORS and cache headers.**  
The endpoint reads the allowed client origin from an environment variable, sets `Access-Control-Allow-Origin` to that specific value, adds `Vary: Origin`, suppresses `X-Powered-By`, applies rate limiting, and streams the font file:

```javascript
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'node:url';

const app = express();
app.disable('x-powered-by');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

const fontRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const fontPath = path.join(__dirname, '..', 'fonts', 'MyFont.woff2');

app.get('/fonts/myfont', fontRateLimit, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('Content-Type', 'font/woff2');
  res.sendFile(fontPath);
});
```

This handler returns the font file only to requests from `ALLOWED_ORIGIN`, preventing unauthorized origins from loading your licensed assets. Next.js and other frameworks emit standard CSS [`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) rules at build time; here you control the HTTP response directly.

**Step 4 — Write an `@font-face` rule in your client CSS pointing to the server endpoint.**  
In `client/fonts.css`, declare the font family using your server's font endpoint URL as the `src`. Do not reference a CDN or a relative path into the client bundle:

```css
/* client/fonts.css */
@font-face {
  font-family: 'MyFont';
  src: url('http://localhost:3000/fonts/myfont') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: 'MyFont', system-ui, sans-serif;
}
```

Replace `http://localhost:3000` with your production font server URL when deploying. The [`font-display: swap`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) value ensures text remains visible during font load. Syntax is defined in [W3C CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/#font-face-rule).

**Step 5 — Start the font server and client server from separate processes.**  
The font server and static client must run as two separate processes on different ports. This intentionally replicates the cross-origin scenario: the browser fetches HTML from one origin and font files from another, so the `Access-Control-Allow-Origin` header is exercised exactly as in production:

```bash
# Terminal 1 — font server on port 3000 (default ALLOWED_ORIGIN: http://localhost:5173)
npm install
npm start

# Terminal 2 — static client on port 5173
npx serve client --listen 5173
```

After both servers are running, open `http://localhost:5173` and check DevTools → **Network** → filter by **Font**. The font request should return HTTP 200 with `Access-Control-Allow-Origin: http://localhost:5173`. If the header is missing or does not match the client origin exactly, the browser will block the font **silently**.

**Step 6 — Run the automated smoke test to verify CORS and cache headers.**  
The included test verifies the same headers GitHub Actions checks:

```bash
npm test
```

A passing test confirms `Access-Control-Allow-Origin`, `Vary`, `Cache-Control`, and absence of `X-Powered-By` before you deploy.

**Step 7 — Set the allowed origin environment variable for staging and production.**  
To test with a production domain or staging environment, pass the client origin as an environment variable before starting the server. The server uses it as the exact string for `Access-Control-Allow-Origin` — not a wildcard:

```bash
ALLOWED_ORIGIN=https://app.yourproduct.com npm start
```

Using an environment variable means the same server code can serve development, staging, and production without modification. **Never use `*` for private licensed font endpoints** — any origin on the internet could load your licensed files.

**Step 8 — Add production hardening — authentication, tenant scoping, and rate limiting.**  
The reference implementation is intentionally minimal. In production, add middleware to verify tenant identity (JWT, session, or signed URL), check font entitlements per tenant, and apply rate limiting per client IP or tenant ID. This repo's v1.1.0 release adds basic rate limiting as a starting point. Load any required license tracking script from the client app (for example in `client/index.html`), not from the font endpoint — see [pc-012](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#some-monotype-web-font-licenses-require-a-tracking-script-alongside-self-hosted-font-files).

## Canonical assertions implemented

This pattern implements the following assertions from [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation):

- `pc-004` — web apps and SaaS products require server-level licensing
- `pc-008` — self-hosting web fonts requires a web font license
- `pc-009` — in a self-hosted model, Monotype provides the licensing and governance layer; customer infrastructure handles delivery
- `pc-010` — cross-origin font delivery requires CORS configuration; missing headers cause silent font blocking
- `pc-012` — some Monotype web font licenses require a tracking script alongside self-hosted font files; this font endpoint handles **delivery only** — load any required tracking from the client app when your license mandates it. For privacy-related scope, see the **Clarification** on [pc-012](https://github.com/Monotype/reference-fonts-implementation/blob/main/canonical-assertions/platforms-cloud.md#some-monotype-web-font-licenses-require-a-tracking-script-alongside-self-hosted-font-files).

---

## Usage

1. Obtain font files under a valid Monotype web font license (this repo ships a **small subset** for build/CI; use your own files in forks or production)
2. Place `.woff2` files in `fonts/` and update the filename in `server/index.js` and the URL in `client/fonts.css` to match
3. Run the font server and client as described in Step 5 above

**CI / local smoke:** Run **`npm test`** after **`npm install`**. It starts the font server briefly, retries until `GET /fonts/myfont` succeeds, asserts **`Access-Control-Allow-Origin`**, **`Vary`**, **`Cache-Control`**, and that **`X-Powered-By`** is not sent, then stops the server (same behavior as GitHub Actions).

> **Note:** Do not open `client/index.html` directly as a `file://` URL. Browsers send `Origin: null` for file-based requests, which will not match the configured allowed origin and will cause the font to be silently blocked.

## Font files

This repository includes **`fonts/MyFont.woff2`**, a heavily subsetted version of Gotham Regular, so **GitHub Actions** works out of the box. That file is licensed only for limited testing per **LICENSE** (Monotype terms) and this README's **License** section — not for regular website use or redistribution. For your own project, replace the file and update the filename in `server/index.js` and the URL in `client/fonts.css`. See `fonts/placeholder.txt` for placement notes.

Because `*.woff2` is excluded in `.gitignore`, force-add any specific font file you need tracked in version control:

```bash
git add -f fonts/YourFile.woff2
```

Only do this for demo or test assets — production-licensed font files should be injected via CI secrets or artifact storage when possible.

The `.woff2` format is supported by all modern browsers as of 2018 ([caniuse: WOFF2](https://caniuse.com/woff2)); no fallback formats are required for current browser baselines.

## Requirements

- [Node.js 18+](https://nodejs.org/en/about/releases/)

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
