#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const blueprintsDir = path.join(repoRoot, "blueprints");

const MAX_CONCURRENCY = 10;
const TIMEOUT_MS = 15000;
const USER_AGENT = "Mozilla/5.0 (compatible; DokployTemplatesLinkChecker/1.0)";

const results = { ok: [], broken: [], skipped: [] };
let completed = 0;
let total = 0;

async function checkUrl(url, label, blueprintId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });

    if (res.ok || res.status === 403 || res.status === 429) {
      if (res.status === 429) {
        results.skipped.push({ blueprintId, label, url, status: 429, reason: "Rate limited" });
      } else if (res.status === 403) {
        results.ok.push({ blueprintId, label, url, status: 403, note: "Forbidden (may still be valid)" });
      } else {
        results.ok.push({ blueprintId, label, url, status: res.status });
      }
    } else {
      // If HEAD fails, try GET as fallback
      try {
        const getRes = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(TIMEOUT_MS),
          redirect: "follow",
          headers: { "User-Agent": USER_AGENT },
        });
        if (getRes.ok || getRes.status === 403) {
          results.ok.push({ blueprintId, label, url, status: getRes.status, note: `HEAD returned ${res.status}, GET ok` });
        } else {
          results.broken.push({ blueprintId, label, url, status: getRes.status });
        }
      } catch {
        results.broken.push({ blueprintId, label, url, status: res.status, reason: "HEAD & GET both failed" });
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "Timeout" });
    } else if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "DNS resolution failed" });
    } else if (err.code === "ECONNREFUSED") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "Connection refused" });
    } else if (err.code === "ECONNRESET") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "Connection reset" });
    } else if (err.code === "ENETUNREACH") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "Network unreachable" });
    } else if (err.code === "ERR_INVALID_URL") {
      results.broken.push({ blueprintId, label, url, status: null, reason: "Invalid URL" });
    } else {
      results.broken.push({ blueprintId, label, url, status: null, reason: err.message || String(err) });
    }
  } finally {
    clearTimeout(timer);
  }
}

async function checkLinks(entries) {
  const queue = [];
  for (const [blueprintId, links] of entries) {
    for (const [label, url] of Object.entries(links)) {
      if (!url || typeof url !== "string" || url.trim() === "") {
        results.skipped.push({ blueprintId, label, url, reason: "Empty URL" });
        continue;
      }
      const trimmed = url.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        results.skipped.push({ blueprintId, label, url: trimmed, reason: "Non-HTTP URL" });
        continue;
      }
      total++;
      queue.push({ url: trimmed, label, blueprintId });
    }
  }

  console.log(`\nChecking ${total} links across ${entries.length} templates...\n`);

  const runNext = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      await checkUrl(item.url, item.label, item.blueprintId);
      completed++;
      if (completed % 50 === 0 || completed === total) {
        const pct = ((completed / total) * 100).toFixed(1);
        console.log(`  Progress: ${completed}/${total} (${pct}%) — ${results.broken.length} broken so far`);
      }
    }
  };

  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, total || 1) }, () => runNext());
  await Promise.all(workers);
}

function printReport() {
  console.log("\n" + "=".repeat(70));
  console.log("LINK CHECK REPORT");
  console.log("=".repeat(70));
  console.log(`  Total checked : ${total}`);
  console.log(`  OK            : ${results.ok.length}`);
  console.log(`  Broken        : ${results.broken.length}`);
  console.log(`  Skipped       : ${results.skipped.length}`);

  if (results.broken.length > 0) {
    console.log("\n" + "-".repeat(70));
    console.log("BROKEN LINKS:");
    console.log("-".repeat(70));
    for (const b of results.broken) {
      const status = b.status ? `HTTP ${b.status}` : "N/A";
      const reason = b.reason ? ` — ${b.reason}` : "";
      console.log(`  [${b.blueprintId}] ${b.label}: ${b.url}`);
      console.log(`           Status: ${status}${reason}`);
    }
  }

  if (results.skipped.length > 0) {
    console.log("\n" + "-".repeat(70));
    console.log("SKIPPED:");
    console.log("-".repeat(70));
    for (const s of results.skipped) {
      console.log(`  [${s.blueprintId}] ${s.label}: ${s.url || "(empty)"} — ${s.reason}`);
    }
  }
}

async function main() {
  const dirs = fs
    .readdirSync(blueprintsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const entries = [];

  for (const dir of dirs) {
    const metaFile = path.join(blueprintsDir, dir, "meta.json");
    if (!fs.existsSync(metaFile)) continue;

    try {
      const entry = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      if (entry.links && typeof entry.links === "object") {
        entries.push([entry.id || dir, entry.links]);
      }
    } catch {
      // skip invalid JSON
    }
  }

  await checkLinks(entries);
  printReport();

  process.exit(results.broken.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
