import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

const child = spawn(process.execPath, ["server/index.js"], {
  cwd: root,
  stdio: "inherit",
});

function assertHeader(headers, name, predicate) {
  const value = headers.get(name);
  if (!value || !predicate(value)) {
    console.error(`Unexpected ${name}:`, value);
    child.kill("SIGTERM");
    process.exit(1);
  }
}

async function main() {
  for (let i = 0; i < 60; i++) {
    await delay(500);
    try {
      const res = await fetch("http://localhost:3000/fonts/myfont");
      if (!res.ok) continue;

      assertHeader(
        res.headers,
        "access-control-allow-origin",
        (v) => v === expectedOrigin
      );
      assertHeader(res.headers, "vary", (v) => /origin/i.test(v));
      assertHeader(res.headers, "cache-control", (v) => /private/i.test(v));
      if (res.headers.has("x-powered-by")) {
        console.error("X-Powered-By should be disabled");
        child.kill("SIGTERM");
        process.exit(1);
      }

      console.log("Font smoke test passed");
      child.kill("SIGTERM");
      process.exit(0);
    } catch {
      // ECONNREFUSED while server starts
    }
  }
  console.error("Font server did not become ready in time");
  child.kill("SIGTERM");
  process.exit(1);
}

main();
