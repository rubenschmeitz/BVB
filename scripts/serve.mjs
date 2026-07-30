import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const portArgument = process.argv.find((value) => value.startsWith("--port="));
const rootArgument = process.argv.find((value) => value.startsWith("--root="));

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ics": "text/calendar; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

export async function startStaticServer({
  port = 4173,
  rootDirectory = "_site",
  quiet = false
} = {}) {
  const root = path.resolve(rootDirectory);
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const candidate = decodedPath === "/" ? "/index.html" : decodedPath;
    const requestedPath = path.resolve(root, `.${candidate}`);

    if (!requestedPath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(requestedPath);
      if (!fileStat.isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Content-Type": contentTypes[path.extname(requestedPath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(requestedPath).pipe(response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(path.join(root, "404.html")).pipe(response);
    }
  });

  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  if (!quiet) {
    console.log(`BVB testserver actief op http://127.0.0.1:${server.address().port}`);
  }
  return server;
}

const isEntrypoint =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isEntrypoint) {
  await startStaticServer({
    port: Number(portArgument?.split("=")[1] || 4173),
    rootDirectory: rootArgument?.split("=").slice(1).join("=") || "_site"
  });
}
