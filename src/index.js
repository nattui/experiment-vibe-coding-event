import { serve } from "bun";
import { join } from "path";

const server = serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

    try {
      const file = Bun.file(join(import.meta.dir, "..", filePath));
      return new Response(file);
    } catch (error) {
      return new Response("404 Not Found", { status: 404 });
    }
  },
});

console.log(`Server running at http://localhost:${server.port}`);
