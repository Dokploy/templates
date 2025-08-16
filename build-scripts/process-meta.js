#!/usr/bin/env node

/**
 * Production build script for processing meta.json
 * This script is designed to be run during CI/CD or build processes
 */

const fs = require("fs");
const path = require("path");

class MetaProcessor {
  constructor(options = {}) {
    this.options = {
      inputFile: options.inputFile || "meta.json",
      outputFile: options.outputFile || null, // If null, overwrites input
      createBackup: options.createBackup || false, // Default false
      verbose: options.verbose || false,
      validateSchema: options.validateSchema !== false, // Default true
      exitOnError: options.exitOnError !== false, // Default true
      ...options,
    };
  }

  log(message, level = "info") {
    if (!this.options.verbose && level === "debug") return;

    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "🔧",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        debug: "🔍",
      }[level] || "ℹ️";

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  validateSchema(item, index) {
    const requiredFields = [
      "id",
      "name",
      "version",
      "description",
      "links",
      "logo",
      "tags",
    ];
    const missing = requiredFields.filter((field) => !item[field]);

    if (missing.length > 0) {
      this.log(
        `Item at index ${index} missing required fields: ${missing.join(", ")}`,
        "warning"
      );
      return false;
    }

    // Validate links structure
    if (typeof item.links !== "object" || !item.links.github) {
      this.log(`Item "${item.id}" has invalid links structure`, "warning");
    }

    // Validate tags is array
    if (!Array.isArray(item.tags)) {
      this.log(
        `Item "${item.id}" has invalid tags (should be array)`,
        "warning"
      );
    }

    return true;
  }

  async process() {
    const startTime = Date.now();
    this.log(`Starting meta.json processing...`);

    try {
      // Read input file
      if (!fs.existsSync(this.options.inputFile)) {
        throw new Error(`Input file not found: ${this.options.inputFile}`);
      }

      const fileContent = fs.readFileSync(this.options.inputFile, "utf8");
      let data;

      try {
        data = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON in ${this.options.inputFile}: ${parseError.message}`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          `Expected array in ${this.options.inputFile}, got ${typeof data}`
        );
      }

      this.log(`Found ${data.length} total entries`);

      // Process data
      const results = this.dedupeAndSort(data);

      // Create backup if requested
      if (this.options.createBackup) {
        const backupPath = `${this.options.inputFile}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, fileContent, "utf8");
        this.log(`Backup created: ${backupPath}`, "debug");
      }

      // Write output
      const outputFile = this.options.outputFile || this.options.inputFile;
      const newContent = this.formatJSON(results.unique) + "\n";
      fs.writeFileSync(outputFile, newContent, "utf8");

      // Report results
      const duration = Date.now() - startTime;
      this.log(`Processing completed in ${duration}ms`, "success");
      this.log(`Statistics:`, "info");
      this.log(`  • Original entries: ${results.original}`, "info");
      this.log(`  • Duplicates removed: ${results.duplicatesRemoved}`, "info");
      this.log(`  • Final entries: ${results.final}`, "info");
      this.log(`  • Schema violations: ${results.schemaViolations}`, "info");

      if (results.duplicates.length > 0) {
        this.log(`Removed duplicates:`, "warning");
        results.duplicates.forEach((dup) => {
          this.log(`  • "${dup.id}" (${dup.name})`, "warning");
        });
      }

      return results;
    } catch (error) {
      this.log(`Processing failed: ${error.message}`, "error");
      if (this.options.exitOnError) {
        process.exit(1);
      }
      throw error;
    }
  }

  dedupeAndSort(data) {
    const seenIds = new Set();
    const duplicates = [];
    const unique = [];
    let schemaViolations = 0;

    data.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        this.log(`Skipping invalid item at index ${index}`, "warning");
        schemaViolations++;
        return;
      }

      if (!item.id) {
        this.log(
          `Skipping item without ID at index ${index}: ${
            item.name || "Unknown"
          }`,
          "warning"
        );
        schemaViolations++;
        return;
      }

      // Validate schema if enabled
      if (this.options.validateSchema) {
        if (!this.validateSchema(item, index)) {
          schemaViolations++;
        }
      }

      // Check for duplicates
      if (seenIds.has(item.id)) {
        duplicates.push({
          id: item.id,
          name: item.name || "Unknown",
          originalIndex: index,
        });
        this.log(
          `Duplicate ID found: "${item.id}" (${item.name || "Unknown"})`,
          "warning"
        );
      } else {
        seenIds.add(item.id);
        unique.push(item);
      }
    });

    // Sort alphabetically by ID (ASCII order)
    unique.sort((a, b) => {
      const idA = a.id.toLowerCase();
      const idB = b.id.toLowerCase();
      return idA < idB ? -1 : idA > idB ? 1 : 0;
    });

    return {
      original: data.length,
      duplicatesRemoved: duplicates.length,
      final: unique.length,
      duplicates,
      unique,
      schemaViolations,
    };
  }

  formatJSON(data) {
    // Custom JSON formatter that keeps small arrays compact
    return JSON.stringify(
      data,
      (key, value) => {
        if (Array.isArray(value)) {
          // Keep arrays compact if they're small and contain only strings
          if (
            value.length <= 5 &&
            value.every((item) => typeof item === "string" && item.length < 50)
          ) {
            return value;
          }
        }
        return value;
      },
      2
    );
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i":
        options.inputFile = args[++i];
        break;
      case "--output":
      case "-o":
        options.outputFile = args[++i];
        break;
      case "--backup":
        options.createBackup = true;
        break;
      case "--no-backup":
        options.createBackup = false;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--no-schema-validation":
        options.validateSchema = false;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: node process-meta.js [options]

Options:
  -i, --input <file>         Input file path (default: meta.json)
  -o, --output <file>        Output file path (default: same as input)
  --backup                  Create backup file (disabled by default)
  -v, --verbose             Verbose output
  --no-schema-validation    Skip schema validation
  -h, --help                Show this help message

Examples:
  node process-meta.js
  node process-meta.js --input data/meta.json --output dist/meta.json
  node process-meta.js --verbose --no-backup
        `);
        process.exit(0);
        break;
    }
  }

  const processor = new MetaProcessor(options);
  processor.process().catch((error) => {
    console.error("Process failed:", error.message);
    process.exit(1);
  });
}

module.exports = MetaProcessor;
