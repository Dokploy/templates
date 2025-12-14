#!/usr/bin/env tsx

/**
 * Validation script for docker-compose.yml files
 * Validates structure, syntax, and best practices for Dokploy templates
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import type { ComposeSpecification, DefinitionsService } from "./type";

interface DockerComposeValidatorOptions {
	composePath?: string | null;
	verbose?: boolean;
	exitOnError?: boolean;
}

interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

type LogLevel = "info" | "success" | "warning" | "error" | "debug";

class DockerComposeValidator {
	private options: Required<DockerComposeValidatorOptions>;
	private errors: string[] = [];
	private warnings: string[] = [];

	constructor(options: DockerComposeValidatorOptions = {}) {
		this.options = {
			composePath: options.composePath || null,
			verbose: options.verbose || false,
			exitOnError: options.exitOnError !== false,
			...options,
		};
	}

	private log(message: string, level: LogLevel = "info"): void {
		if (!this.options.verbose && level === "debug") return;

		const prefix: Record<LogLevel, string> = {
			info: "🔍",
			success: "✅",
			warning: "⚠️",
			error: "❌",
			debug: "🔍",
		};

		console.log(`${prefix[level] || "ℹ️"} ${message}`);
	}

	private error(message: string): void {
		this.errors.push(message);
		this.log(message, "error");
	}

	private warning(message: string): void {
		this.warnings.push(message);
		this.log(message, "warning");
	}

	/**
	 * Parse docker-compose.yml file
	 */
	private parseCompose(composePath: string): ComposeSpecification | null {
		try {
			if (!fs.existsSync(composePath)) {
				this.error(`docker-compose.yml not found at ${composePath}`);
				return null;
			}

			const content = fs.readFileSync(composePath, "utf8");
			const compose = yaml.parse(content) as ComposeSpecification;

			if (!compose || typeof compose !== "object") {
				this.error(`Invalid docker-compose.yml structure at ${composePath}`);
				return null;
			}

			return compose;
		} catch (error: any) {
			this.error(`Failed to parse docker-compose.yml: ${error.message}`);
			return null;
		}
	}

	/**
	 * Validate that docker-compose.yml can be processed by Docker Compose
	 */
	private validateDockerComposeSyntax(composePath: string): boolean {
		// This would ideally use docker compose config, but for now we validate structure
		// The actual syntax validation happens in the CI/CD workflow with docker compose config
		const compose = this.parseCompose(composePath);
		return compose !== null;
	}

	/**
	 * Validate services don't use container_name (Dokploy best practice)
	 */
	private validateNoContainerName(services: Record<string, DefinitionsService>): void {
		Object.entries(services).forEach(([serviceName, service]) => {
			if (service.container_name) {
				this.error(
					`Service '${serviceName}': Found 'container_name' field. According to README, container_name should not be used. Dokploy manages container names automatically.`
				);
			}
		});
	}

	/**
	 * Validate no explicit networks (Dokploy creates networks automatically)
	 */
	private validateNoExplicitNetworks(
		compose: ComposeSpecification,
		services: Record<string, DefinitionsService>
	): void {
		// Check for dokploy-network specifically
		const hasDokployNetwork = compose.networks && "dokploy-network" in compose.networks;

		// Check if any service uses explicit networks
		Object.entries(services).forEach(([serviceName, service]) => {
			if (service.networks) {
				if (typeof service.networks === "object" && !Array.isArray(service.networks)) {
					const networkNames = Object.keys(service.networks);
					if (networkNames.includes("dokploy-network")) {
						this.error(
							`Service '${serviceName}': Uses 'dokploy-network'. Dokploy creates networks automatically, explicit networks are not needed.`
						);
					} else if (networkNames.length > 0) {
						this.error(
							`Service '${serviceName}': Uses explicit network configuration. Dokploy creates networks automatically, explicit networks are not needed.`
						);
					}
				} else if (Array.isArray(service.networks)) {
					if (service.networks.includes("dokploy-network")) {
						this.error(
							`Service '${serviceName}': Uses 'dokploy-network'. Dokploy creates networks automatically, explicit networks are not needed.`
						);
					} else if (service.networks.length > 0) {
						this.error(
							`Service '${serviceName}': Uses explicit network configuration. Dokploy creates networks automatically, explicit networks are not needed.`
						);
					}
				}
			}
		});

		// Check if networks section exists at root level
		if (hasDokployNetwork) {
			this.error(
				"Found 'dokploy-network' in networks section. Dokploy creates networks automatically, explicit networks are not needed."
			);
		}

		if (compose.networks && Object.keys(compose.networks).length > 0) {
			this.error(
				"Found explicit networks section. Dokploy creates networks automatically, explicit networks are not needed."
			);
		}
	}

	/**
	 * Validate ports are not mapped (should be just numbers, not host:container)
	 */
	private validatePortsFormat(services: Record<string, DefinitionsService>): void {
		Object.entries(services).forEach(([serviceName, service]) => {
			if (service.ports) {
				service.ports.forEach((port, index) => {
					if (typeof port === "string") {
						// Check for port mapping format (e.g., "3000:3000" or "8080:80")
						if (/^\d+:\d+/.test(port)) {
							this.error(
								`Service '${serviceName}': ports[${index}] uses port mapping format '${port}'. According to README, use only port number (e.g., '3000') instead of '3000:3000'. Dokploy handles port routing.`
							);
						}
					} else if (typeof port === "object" && port !== null) {
						// Check for published port mapping
						if (port.published && port.target) {
							this.error(
								`Service '${serviceName}': ports[${index}] uses port mapping (published: ${port.published}, target: ${port.target}). According to README, use only port number. Dokploy handles port routing.`
							);
						}
					}
				});
			}
		});
	}

	/**
	 * Validate services exist
	 */
	private validateServicesExist(compose: ComposeSpecification): boolean {
		if (!compose.services || Object.keys(compose.services).length === 0) {
			this.error("No services found in docker-compose.yml");
			return false;
		}

		const serviceNames = Object.keys(compose.services);
		this.log(`Found ${serviceNames.length} service(s): ${serviceNames.join(", ")}`, "debug");

		return true;
	}

	/**
	 * Validate service names follow best practices
	 */
	private validateServiceNames(services: Record<string, DefinitionsService>): void {
		Object.keys(services).forEach((serviceName) => {
			// Service names should be lowercase and use hyphens
			if (serviceName !== serviceName.toLowerCase()) {
				this.warning(
					`Service '${serviceName}': Service names should be lowercase. Consider using '${serviceName.toLowerCase()}'.`
				);
			}

			// Service names should not contain underscores (use hyphens instead)
			if (serviceName.includes("_")) {
				this.warning(
					`Service '${serviceName}': Service names should use hyphens instead of underscores. Consider using '${serviceName.replace(/_/g, "-")}'.`
				);
			}
		});
	}


	/**
	 * Main validation method
	 */
	validate(): ValidationResult {
		if (!this.options.composePath) {
			this.error("composePath option is required");
			if (this.options.exitOnError) {
				process.exit(1);
			}
			return { valid: false, errors: this.errors, warnings: this.warnings };
		}

		const composePath = this.options.composePath;
		const templateName = path.basename(path.dirname(composePath));

		this.log(`Validating docker-compose.yml: ${templateName}`);

		// Parse and validate syntax
		if (!this.validateDockerComposeSyntax(composePath)) {
			if (this.options.exitOnError) {
				process.exit(1);
			}
			return { valid: false, errors: this.errors, warnings: this.warnings };
		}

		const compose = this.parseCompose(composePath);
		if (!compose) {
			if (this.options.exitOnError) {
				process.exit(1);
			}
			return { valid: false, errors: this.errors, warnings: this.warnings };
		}

		// Validate services exist
		if (!this.validateServicesExist(compose)) {
			if (this.options.exitOnError) {
				process.exit(1);
			}
			return { valid: false, errors: this.errors, warnings: this.warnings };
		}

		const services = compose.services || {};

		// Run all validations
		this.validateNoContainerName(services);
		this.validateNoExplicitNetworks(compose, services);
		this.validatePortsFormat(services);
		this.validateServiceNames(services);

		// Show summary
		if (this.errors.length === 0) {
			this.log("Docker Compose file structure is valid", "success");

			if (this.options.verbose) {
				this.log("📋 Services found:", "info");
				Object.keys(services).forEach((serviceName) => {
					const service = services[serviceName];
					const image = typeof service.image === "string" ? service.image : "N/A";
					this.log(`   - ${serviceName}: ${image}`, "debug");
				});
			}
		}

		const valid = this.errors.length === 0;

		if (!valid && this.options.exitOnError) {
			process.exit(1);
		}

		return { valid, errors: this.errors, warnings: this.warnings };
	}
}

// CLI usage
if (require.main === module) {
	const args = process.argv.slice(2);
	const options: DockerComposeValidatorOptions = {};
	let composePath: string | null = null;

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--file":
			case "-f":
				composePath = args[++i];
				break;
			case "--verbose":
			case "-v":
				options.verbose = true;
				break;
			case "--help":
			case "-h":
				console.log(`
Usage: tsx validate-docker-compose.ts [options]

Options:
  -f, --file <path>    Docker Compose file path (required)
  -v, --verbose        Verbose output
  -h, --help           Show this help message

Examples:
  tsx validate-docker-compose.ts --file blueprints/grafana/docker-compose.yml
  tsx validate-docker-compose.ts -f blueprints/grafana/docker-compose.yml --verbose
        `);
				process.exit(0);
				break;
		}
	}

	if (!composePath) {
		console.error("❌ Error: --file option is required");
		console.error("Use --help for usage information");
		process.exit(1);
	}

	const validator = new DockerComposeValidator({
		composePath,
		...options,
	});

	const result = validator.validate();

	// Exit with appropriate code
	process.exit(result.valid ? 0 : 1);
}

export default DockerComposeValidator;

