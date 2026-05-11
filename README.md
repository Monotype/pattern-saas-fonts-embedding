# pattern-saas-fonts-embedding

> Server-controlled font delivery for SaaS applications.

This repository demonstrates the correct pattern for serving licensed fonts in a SaaS architecture. An Express server controls all font delivery through a dedicated endpoint — fonts never enter the client bundle and are never fetched from an uncontrolled CDN.

## What this pattern demonstrates

- An Express server (`server/`) that serves font files from a controlled endpoint with scoped CORS headers
- A client (`client/`) that loads fonts via `@font-face` pointing to the server endpoint
- How server-side delivery keeps font assets and licensing obligations under the operator’s control

## Why server-controlled delivery is the license-safe approach

In a SaaS product, end users interact with fonts rendered by your application — constituting font access that requires server or app licensing. Delivering fonts from your own server endpoint (rather than a public CDN or client bundle) keeps delivery within your licensed infrastructure and allows you to enforce access controls, scope delivery to known origins, and maintain audit visibility.

## Canonical assertions implemented

This pattern implements the following assertions from [reference-fonts-implementation](https://github.com/Monotype/reference-fonts-implementation):

- `pc-004` — web apps and SaaS products require server-level licensing
- `pc-008` — self-hosting web fonts requires a web font license
- `pc-009` — in a self-hosted model, Monotype provides the licensing and governance layer; customer infrastructure handles delivery
- `pc-010` — cross-origin font delivery requires CORS configuration; missing headers cause silent font blocking

## Usage

1. Place a `.woff2` font file in `fonts/` — this directory is gitignored; supply your own under a valid Monotype web font license
2. Update the filename in `server/index.js` and the URL in `client/fonts.css` to match
3. Run the font server and client from two terminals:

```bash
# Terminal 1 — font server (default ALLOWED_ORIGIN: http://localhost:5173)
npm install
npm start

# Terminal 2 — static client server
npx serve client --listen 5173
```

4. Visit `http://localhost:5173` in a browser

This two-server setup is intentional — it replicates the cross-origin scenario the pattern is designed for: client and font server on different origins, with the `Access-Control-Allow-Origin` header controlling which client origins may load fonts.

To test with a different client origin or in a deployed environment:

```bash
ALLOWED_ORIGIN=https://yourapp.com npm start
```

> **Note:** Do not open `client/index.html` directly as a `file://` URL. Browsers send `Origin: null` for file-based requests, which will not match the configured allowed origin and will cause the font to be silently blocked.

## Font files

Font files are intentionally excluded from this repository via `.gitignore`. Place your licensed `.woff2` file in `fonts/`. Do not commit font files.

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

## Related patterns

- [pattern-nextjs-webfonts](https://github.com/Monotype/pattern-nextjs-webfonts) — Next.js build-time font loading via `next/font/local`
- [pattern-react-webfonts](https://github.com/Monotype/pattern-react-webfonts) — React component library with CSS variable delivery
- [pattern-cicd-fonts-usage](https://github.com/Monotype/pattern-cicd-fonts-usage) — CI/CD pipeline font management
- [pattern-variable-fonts-usage](https://github.com/Monotype/pattern-variable-fonts-usage) — variable font axes via CSS

## Support

Use GitHub Discussions (Q&A category) for questions about this pattern.

## License

Code in this repository is provided for educational and interoperability purposes. Font files are not included. Canonical guidance © Monotype Imaging Inc.

