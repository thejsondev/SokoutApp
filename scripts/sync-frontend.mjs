import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "out");
const frontendDir = join(root, "frontend");

if (!existsSync(outDir)) {
  console.error("Missing out/ — run STATIC_EXPORT=1 next build first.");
  process.exit(1);
}

rmSync(frontendDir, { recursive: true, force: true });
cpSync(outDir, frontendDir, { recursive: true });
console.log("Synced out/ → frontend/");
