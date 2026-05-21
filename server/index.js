import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable("x-powered-by");

// Restrict font delivery to known origins. In production, this would be
// scoped to your application domain(s) — never a wildcard.
// See canonical assertion pc-010: cross-origin font delivery requires
// correct CORS configuration; missing or permissive headers undermine
// delivery control.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

const fontPath = path.join(__dirname, "..", "fonts", "MyFont.woff2");

// Limit font requests to 60 per minute per IP to prevent DoS via filesystem exhaustion.
// Tune windowMs / max to match your traffic profile in production.
const fontRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// This handler serves font bytes only (see pc-010). If your license requires a tracking
// script (pc-012 in reference-fonts-implementation), add it from the client app—not here.
app.get("/fonts/myfont", fontRateLimit, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  // Demo: short private cache. Tune (or use CDN rules) once entitlements and
  // privacy requirements are defined — see README "Scope and Intent".
  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("Content-Type", "font/woff2");
  res.sendFile(fontPath);
});

app.listen(3000, () => {
  console.log("Font server running on http://localhost:3000");
});
