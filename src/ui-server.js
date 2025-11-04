import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { sanitizeSelections } from "./blueprint.js";
import { openBrowser, slugify } from "./utils.js";

const moduleDir = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(moduleDir, "../../dist");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

const getMimeType = (filePath) => mimeTypes[extname(filePath)] ?? "text/plain; charset=utf-8";

export const collectConfigViaUi = async () => {
  if (!existsSync(distDir)) {
    throw new Error(
      "Equalizer UI build not found. Run `npm run build` at the project root before using UI mode.",
    );
  }

  let resolveConfig;
  let rejectConfig;
  const configPromise = new Promise((resolve, reject) => {
    resolveConfig = resolve;
    rejectConfig = reject;
  });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/complete") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const projectName = slugify(payload.projectName ?? "my-app");
          const framework = payload.framework ?? "react";
          const sanitizedSelections = sanitizeSelections(
            {
              styling: payload.styling ?? [],
              data: payload.dataLayer ?? payload.data ?? [],
              state: payload.state ?? [],
              tooling: payload.tooling ?? [],
            },
            framework,
          );

          resolveConfig({
            mode: "ui",
            projectName,
            packageManager: payload.packageManager ?? "pnpm",
            framework,
            useTypescript:
              framework === "angular" ? true : Boolean(payload.typescript ?? true),
            ...sanitizedSelections,
          });
          res.writeHead(204).end();
        } catch (error) {
          res
            .writeHead(400, { "Content-Type": "application/json" })
            .end(JSON.stringify({ error: "Invalid payload", message: error.message }));
          rejectConfig(error);
        }
      });
      return;
    }

    try {
      const relativePath = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = resolve(distDir, `.${relativePath}`);
      if (!filePath.startsWith(distDir)) {
        throw new Error("Out of bounds");
      }
      const file = await readFile(filePath);
      res.writeHead(200, { "Content-Type": getMimeType(relativePath) });
      res.end(file);
    } catch {
      const fallback = await readFile(resolve(distDir, "./index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fallback);
    }
  });

  server.on("error", (error) => {
    rejectConfig(error);
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const uiUrl = `http://localhost:${port}/?origin=cli`;

  process.stdout.write(`\nLaunching Equalizer UI at ${uiUrl}\n`);
  await openBrowser(uiUrl);

  const result = await configPromise;
  await new Promise((resolve) => server.close(resolve));
  process.stdout.write("Configuration received from the browser.\n");
  return result;
};
