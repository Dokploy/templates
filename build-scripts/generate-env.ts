#!/usr/bin/env tsx

/**
 * Generate .env file from template.toml for docker-compose validation
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "toml";
import { processVariables, processValue, type Schema } from "./helpers";

/**
 * Generate .env file from template.toml
 */
export function generateEnvFromTemplate(
	templateDir: string,
	outputPath?: string
): string {
	const templatePath = path.join(templateDir, "template.toml");
	const envPath = outputPath || path.join(templateDir, ".env.tmp");

	if (!fs.existsSync(templatePath)) {
		throw new Error(`template.toml not found at ${templatePath}`);
	}

	// Parse template.toml
	const content = fs.readFileSync(templatePath, "utf8");
	const data = parse(content) as any;

	// Process variables
	const schema: Schema = {};
	const processedVars = data.variables
		? processVariables(data.variables, schema)
		: {};

	// Process env vars
	const envVars: Record<string, string> = {};

	if (data.config?.env) {
		if (Array.isArray(data.config.env)) {
			// Array format: ["KEY=VALUE", ...]
			data.config.env.forEach((env: string) => {
				if (typeof env === "string" && env.includes("=")) {
					const [key, ...valueParts] = env.split("=");
					const value = valueParts.join("="); // Rejoin in case value contains =
					
					// Process the value, handling empty strings correctly
					let processedValue: string;
					if (value === "") {
						processedValue = "";
					} else {
						processedValue = processValue(value, processedVars, schema);
						// If after processing it still contains ${} and the variable exists but is empty, use empty string
						if (processedValue.includes("${")) {
							const varMatch = processedValue.match(/\${([^}]+)}/);
							if (varMatch) {
								const varName = varMatch[1];
								if (varName in processedVars && processedVars[varName] === "") {
									processedValue = "";
								}
							}
						}
					}
					envVars[key] = processedValue;
				}
			});
		} else if (typeof data.config.env === "object") {
			// Object format: { KEY: "VALUE", ... }
			Object.entries(data.config.env).forEach(([key, value]) => {
				if (typeof value === "string") {
					let processedValue: string;
					if (value === "") {
						processedValue = "";
					} else {
						processedValue = processValue(value, processedVars, schema);
						// If after processing it still contains ${} and the variable exists but is empty, use empty string
						if (processedValue.includes("${")) {
							const varMatch = processedValue.match(/\${([^}]+)}/);
							if (varMatch) {
								const varName = varMatch[1];
								if (varName in processedVars && processedVars[varName] === "") {
									processedValue = "";
								}
							}
						}
					}
					envVars[key] = processedValue;
				} else {
					envVars[key] = String(value);
				}
			});
		}
	}

	// Generate .env file content
	const envContent = Object.entries(envVars)
		.map(([key, value]) => {
			// For empty strings, just output empty quotes
			if (value === "") {
				return `${key}=""`;
			}
			
			// Escape special characters in values
			// Don't escape $ if it's part of ${} that wasn't resolved (shouldn't happen, but be safe)
			const escapedValue = value
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"')
				.replace(/\n/g, "\\n")
				// Only escape $ if it's not part of ${} pattern
				.replace(/\$(?!\{)/g, "\\$");
			return `${key}="${escapedValue}"`;
		})
		.join("\n");

	// Write .env file
	fs.writeFileSync(envPath, envContent, "utf8");

	return envPath;
}

// CLI usage
if (require.main === module) {
	const args = process.argv.slice(2);
	let templateDir: string | null = null;
	let outputPath: string | null = null;

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--dir":
			case "-d":
				templateDir = args[++i];
				break;
			case "--output":
			case "-o":
				outputPath = args[++i];
				break;
			case "--help":
			case "-h":
				console.log(`
Usage: tsx generate-env.ts [options]

Options:
  -d, --dir <path>     Template directory path (required)
  -o, --output <path>  Output .env file path (default: <templateDir>/.env.tmp)
  -h, --help           Show this help message

Examples:
  tsx generate-env.ts --dir blueprints/grafana
  tsx generate-env.ts -d blueprints/grafana -o /tmp/grafana.env
        `);
				process.exit(0);
				break;
		}
	}

	if (!templateDir) {
		console.error("❌ Error: --dir option is required");
		console.error("Use --help for usage information");
		process.exit(1);
	}

	try {
		const envPath = generateEnvFromTemplate(templateDir, outputPath || undefined);
		console.log(`✅ Generated .env file: ${envPath}`);
		process.exit(0);
	} catch (error: any) {
		console.error(`❌ Error: ${error.message}`);
		process.exit(1);
	}
}

export default generateEnvFromTemplate;

