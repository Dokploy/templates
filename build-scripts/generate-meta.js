#!/usr/bin/env node

/**
 * Aggregates every blueprints/<id>/meta.json into a single meta.json artifact
 * (the file the templates app serves at /meta.json).
 *
 * Each template owns its metadata inside its own folder, so pull requests
 * never touch a shared file and meta.json merge conflicts cannot happen.
 *
 * Usage:
 *   node build-scripts/generate-meta.js                 # writes app/public/meta.json
 *   node build-scripts/generate-meta.js --output <file> # custom output path
 *   node build-scripts/generate-meta.js --check         # validate only, write nothing
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const outIdx = args.indexOf("--output");

// Anchor all paths to the repo root so the script works from any cwd
// (app/package.json invokes it as `node ../build-scripts/generate-meta.js`).
const repoRoot = path.resolve(__dirname, "..");
const outputPath =
  outIdx >= 0
    ? path.resolve(args[outIdx + 1])
    : path.join(repoRoot, "app", "public", "meta.json");

const blueprintsDir = path.join(repoRoot, "blueprints");
const REQUIRED_FIELDS = ["id", "name", "version", "description", "links", "logo", "tags"];
const REQUIRED_LINKS = ["github", "website", "docs"];

const errors = [];
const warnings = [];
const entries = [];

const dirs = fs
  .readdirSync(blueprintsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b));

for (const dir of dirs) {
  const metaFile = path.join(blueprintsDir, dir, "meta.json");
  if (!fs.existsSync(metaFile)) {
    errors.push(`${dir}: missing blueprints/${dir}/meta.json`);
    continue;
  }

  let entry;
  try {
    entry = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  } catch (e) {
    errors.push(`${dir}/meta.json: invalid JSON (${e.message})`);
    continue;
  }

  if (Array.isArray(entry) || typeof entry !== "object" || entry === null) {
    errors.push(`${dir}/meta.json: must be a single JSON object`);
    continue;
  }

  if (entry.id !== dir) {
    errors.push(`${dir}/meta.json: "id" must be "${dir}" (got ${JSON.stringify(entry.id)})`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (
      entry[field] === undefined ||
      entry[field] === null ||
      entry[field] === ""
    ) {
      errors.push(`${dir}/meta.json: missing required field "${field}"`);
    }
  }

  if (entry.links && typeof entry.links === "object") {
    for (const link of REQUIRED_LINKS) {
      // An empty string is allowed ("this project has no website"); only a
      // missing key is an error — same semantics as the previous CI check.
      if (entry.links[link] === undefined || entry.links[link] === null) {
        errors.push(`${dir}/meta.json: links is missing required field "${link}"`);
      }
    }
  }

  if (entry.tags !== undefined && (!Array.isArray(entry.tags) || entry.tags.length === 0)) {
    errors.push(`${dir}/meta.json: tags must be a non-empty array`);
  }

  if (
    typeof entry.logo === "string" &&
    entry.logo &&
    !fs.existsSync(path.join(blueprintsDir, dir, entry.logo))
  ) {
    errors.push(`${dir}: logo file "${entry.logo}" not found in blueprints/${dir}/`);
  }

  entries.push(entry);
}

entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));

for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error(`\n🚨 ${errors.length} error(s) found across ${dirs.length} blueprints`);
  process.exit(1);
}

console.log(`✅ ${entries.length} templates validated`);

if (!checkOnly) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2) + "\n");
  console.log(`📦 Wrote ${outputPath}`);
}
