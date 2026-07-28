import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "maplibre-gl",
    "dist",
    "maplibre-gl-worker.mjs"
  );
  const workerSource = (await readFile(workerPath, "utf8")).replace(
    /\n\/\/# sourceMappingURL=.*\n?$/,
    "\n"
  );

  return new Response(workerSource, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "application/javascript; charset=utf-8"
    }
  });
}
