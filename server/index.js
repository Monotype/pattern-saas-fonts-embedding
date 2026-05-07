import express from "express";
import path from "path";

const app = express();

// Restrict font delivery to known origins. In production, this would be
// scoped to your application domain(s) — never a wildcard.
// See canonical assertion pc-010: cross-origin font delivery requires
// correct CORS configuration; missing or permissive headers undermine
// delivery control.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

const fontPath = path.resolve("fonts/MyFont.woff2");

app.get("/fonts/myfont", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Content-Type", "font/woff2");
  res.sendFile(fontPath);
});

app.listen(3000, () => {
  console.log("Font server running on http://localhost:3000");
});
