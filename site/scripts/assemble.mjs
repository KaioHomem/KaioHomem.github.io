// Puts the whole published site together in site/out:
// the Next.js export (already there after `next build`) plus every static file that
// lives at the repository root (calculators, product, privacy page, CVs, sitemap...).
// Root URLs therefore stay exactly where they were before the redesign.

import { cpSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const here = resolve(import.meta.dirname, "..");
const root = resolve(here, "..");
const out = join(here, "out");

if (!existsSync(join(out, "index.html"))) {
  console.error("site/out/index.html is missing. Run `npm run build` first.");
  process.exit(1);
}

// Never published: sources, tooling and repository metadata.
const skip = new Set([
  ".git",
  ".github",
  ".gitignore",
  "node_modules",
  "site",
  "docs",
  "package.json",
  "package-lock.json",
  "README.md",
  "SEGURANCA.md",
]);

function list(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (dir === root && skip.has(name)) continue;
    const from = join(dir, name);
    if (statSync(from).isDirectory()) list(from, files);
    else files.push(relative(root, from));
  }
  return files;
}

// Check everything before copying anything, so a conflict leaves site/out untouched.
const files = list(root);
const conflicts = files.filter((rel) => existsSync(join(out, rel)));
if (conflicts.length) {
  console.error("These root files would overwrite files from the Next.js export (run `npm run build` again if out/ is stale):");
  for (const c of conflicts) console.error("  - " + c);
  process.exit(1);
}
for (const rel of files) cpSync(join(root, rel), join(out, rel));

// GitHub Pages must serve the _next/ folder as-is, without Jekyll.
writeFileSync(join(out, ".nojekyll"), "");
console.log(`Copied ${files.length} static files from the repository root into site/out.`);
