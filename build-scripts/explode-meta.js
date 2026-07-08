#!/usr/bin/env node

/**
 * One-shot migration: splits the root meta.json into per-template files at
 * blueprints/<id>/meta.json. Kept in the repo for reference and for forks
 * that need to migrate.
 *
 * Usage: node build-scripts/explode-meta.js [path/to/meta.json]
 */

const fs = require("fs");
const path = require("path");

const metaPath = process.argv[2] || "meta.json";
const blueprintsDir = "blueprints";

if (!fs.existsSync(metaPath)) {
  console.error(`❌ ${metaPath} not found`);
  process.exit(1);
}

const entries = JSON.parse(fs.readFileSync(metaPath, "utf8"));
if (!Array.isArray(entries)) {
  console.error("❌ meta.json must be an array");
  process.exit(1);
}

let written = 0;
const missingDirs = [];

for (const entry of entries) {
  if (!entry.id) {
    console.error(`❌ Entry without id: ${JSON.stringify(entry).slice(0, 80)}`);
    process.exit(1);
  }
  const dir = path.join(blueprintsDir, entry.id);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    missingDirs.push(entry.id);
    continue;
  }
  fs.writeFileSync(
    path.join(dir, "meta.json"),
    JSON.stringify(entry, null, 2) + "\n"
  );
  written++;
}

console.log(`✅ Wrote ${written} blueprints/<id>/meta.json files`);
if (missingDirs.length) {
  console.warn(
    `⚠️  ${missingDirs.length} entries have no blueprint folder and were NOT written:`
  );
  for (const id of missingDirs) console.warn(`   - ${id}`);
  process.exit(2);
}
