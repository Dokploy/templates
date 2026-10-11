#!/usr/bin/env tsx

/**
 * Validation script for template.toml and docker-compose.yml files
 * Validates structure, syntax, and consistency between files
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "toml";
import * as yaml from "yaml";
import type { ComposeSpecification } from "./type";
import { processVariables, processValue, type Schema } from "./helpers";

interface TemplateValidatorOptions {
  templateDir?: string | null;
  composeServices?: string[] | null;
  verbose?: boolean;
  exitOnError?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface DomainConfig {
  serviceName?: string;
  port?: number | string;
  host?: string;
  path?: string;
}

interface MountConfig {
  filePath?: string;
  content?: string;
}

interface TemplateData {
  variables?: Record<string, string>;
  config?: {
    domains?: DomainConfig[];
    env?: string[] | Record<string, string | boolean | number> | Array<string | Record<string, string | boolean | number>>;
    mounts?: MountConfig[];
  };
}

type LogLevel = "info" | "success" | "warning" | "error" | "debug";

class TemplateValidator {
  private options: Required<TemplateValidatorOptions>;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(options: TemplateValidatorOptions = {}) {
    this.options = {
      templateDir: options.templateDir || null,
      composeServices: options.composeServices || null,
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
   * Validate helper syntax (based on Dokploy's processValue function)
   */
  private validateHelper(helper: string, context: string = ""): void {
    const validHelpers = [
      "domain",
      "base64",
      "password",
      "hash",
      "uuid",
      "timestamp",
      "timestampms",
      "timestamps",
      "randomPort",
      "jwt",
      "username",
      "email",
    ];

    // Check if it's a helper with parameters
    if (helper.includes(":")) {
      const [helperName, ...params] = helper.split(":");

      // Validate helper name
      if (!validHelpers.includes(helperName)) {
        // Might be a variable reference, which is valid
        return;
      }

      // Validate parameter formats
      if (helperName === "base64" || helperName === "password" || helperName === "hash") {
        // Format: helper:number
        const param = params[0];
        if (param && isNaN(parseInt(param, 10))) {
          this.warning(
            `${context}: helper '${helper}' has invalid parameter (should be a number)`
          );
        }
      } else if (helperName === "timestampms" || helperName === "timestamps") {
        // Format: timestampms:datetime or timestamps:datetime
        const datetime = params.join(":"); // Rejoin in case datetime has colons
        if (datetime) {
          // Try to parse as date
          const date = new Date(datetime);
          if (isNaN(date.getTime())) {
            this.warning(
              `${context}: helper '${helper}' has invalid datetime format`
            );
          }
        }
      } else if (helperName === "jwt") {
        // Format: jwt:secret or jwt:secret:payload or jwt:length
        if (params.length > 0) {
          const firstParam = params[0];
          // If it's a number, it's jwt:length (deprecated but valid)
          if (!isNaN(parseInt(firstParam, 10))) {
            // Valid: jwt:32
            return;
          }
          // Otherwise it's jwt:secret or jwt:secret:payload
          // Both are valid
        }
      }
    } else {
      // Simple helper without parameters
      if (!validHelpers.includes(helper)) {
        // Might be a variable reference, which is valid
        return;
      }
    }
  }

  /**
   * Parse docker-compose.yml and extract service names
   */
  private parseComposeServices(composePath: string): string[] {
    try {
      if (!fs.existsSync(composePath)) {
        this.warning(`docker-compose.yml not found at ${composePath}`);
        return [];
      }

      const content = fs.readFileSync(composePath, "utf8");
      const compose = yaml.parse(content) as ComposeSpecification;

      if (!compose || typeof compose !== "object") {
        this.error(`Invalid docker-compose.yml structure at ${composePath}`);
        return [];
      }

      // Extract service names using the official ComposeSpecification type
      const services = compose.services || {};
      const serviceNames = Object.keys(services);

      if (serviceNames.length === 0) {
        this.warning(`No services found in docker-compose.yml at ${composePath}`);
      }

      return serviceNames;
    } catch (error: any) {
      this.error(
        `Failed to parse docker-compose.yml at ${composePath}: ${error.message}`
      );
      return [];
    }
  }

  /**
   * Validate template.toml structure
   */
  private validateTemplate(tomlPath: string, composeServices: string[] | null = null): boolean {
    try {
      if (!fs.existsSync(tomlPath)) {
        this.error(`template.toml not found at ${tomlPath}`);
        return false;
      }

      // Parse TOML
      let data: TemplateData;
      try {
        const content = fs.readFileSync(tomlPath, "utf8");
        data = parse(content) as TemplateData;
      } catch (parseError: any) {
        this.error(
          `Invalid TOML syntax in ${tomlPath}: ${parseError.message}`
        );
        return false;
      }

      // Validate [config] section exists
      if (!data.config) {
        this.error("Missing [config] section in template.toml");
        return false;
      }

      // Validate domains
      if (data.config.domains) {
        if (!Array.isArray(data.config.domains)) {
          this.error("config.domains must be an array");
          return false;
        }

        data.config.domains.forEach((domain, index) => {
          // Required fields
          if (!domain.serviceName) {
            this.error(`domain[${index}]: Missing required field 'serviceName'`);
          }
          if (domain.port === undefined || domain.port === null) {
            this.error(`domain[${index}]: Missing required field 'port'`);
          }

          // Validate serviceName matches docker-compose.yml services
          if (domain.serviceName && composeServices && composeServices.length > 0) {
            if (!composeServices.includes(domain.serviceName)) {
              this.error(
                `domain[${index}]: serviceName '${domain.serviceName}' not found in docker-compose.yml services. Available services: ${composeServices.join(", ")}`
              );
            }
          }

          // Validate port is a number
          if (domain.port !== undefined && domain.port !== null) {
            const port = typeof domain.port === "string"
              ? parseInt(domain.port.replace(/_/g, ""), 10)
              : domain.port;

            if (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
              this.warning(
                `domain[${index}]: port '${domain.port}' may be invalid (should be 1-65535)`
              );
            }
          }

          // Validate host format (should contain ${} for variable substitution)
          if (domain.host && typeof domain.host === "string") {
            if (!domain.host.includes("${")) {
              this.warning(
                `domain[${index}]: host '${domain.host}' doesn't use variable syntax (e.g., \${main_domain} or \${domain})`
              );
            } else {
              // Validate helpers in host
              const helperPattern = /\${([^}]+)}/g;
              let match: RegExpExecArray | null;
              while ((match = helperPattern.exec(domain.host)) !== null) {
                this.validateHelper(match[1], `domain[${index}].host`);
              }
            }
          }
        });
      } else {
        this.warning("No domains configured in template.toml");
      }

      // Validate env - can be array or object (as per Dokploy's processEnvVars)
      if (data.config.env !== undefined) {
        if (Array.isArray(data.config.env)) {
          // Array format: ["KEY=VALUE", ...]
          data.config.env.forEach((env, index) => {
            if (typeof env === "string") {
              if (!env.includes("=")) {
                this.warning(
                  `config.env[${index}]: '${env}' doesn't follow KEY=VALUE format`
                );
              }
            } else if (typeof env === "object" && env !== null) {
              // Object in array is also valid: [{"KEY": "VALUE"}, ...]
              const keys = Object.keys(env);
              if (keys.length === 0) {
                this.warning(`config.env[${index}]: empty object`);
              }
            } else if (typeof env !== "boolean" && typeof env !== "number") {
              this.error(
                `config.env[${index}]: must be a string, object, boolean, or number`
              );
            }
          });
        } else if (typeof data.config.env === "object" && data.config.env !== null) {
          // Object format: { KEY: "VALUE", ... }
          // This is valid - Dokploy handles both formats
          const envKeys = Object.keys(data.config.env);
          if (envKeys.length === 0) {
            this.warning("config.env is an empty object");
          }
        } else {
          this.error(
            "config.env must be an array or an object (as per Dokploy's processEnvVars)"
          );
        }
      }

      // Validate mounts if present
      if (data.config.mounts) {
        if (!Array.isArray(data.config.mounts)) {
          this.error("config.mounts must be an array");
        } else {
          data.config.mounts.forEach((mount, index) => {
            if (!mount.filePath) {
              this.error(`config.mounts[${index}]: Missing required field 'filePath'`);
            } else if (typeof mount.filePath !== "string") {
              this.error(`config.mounts[${index}]: filePath must be a string`);
            }

            if (mount.content === undefined) {
              this.error(`config.mounts[${index}]: Missing required field 'content'`);
            } else if (typeof mount.content !== "string") {
              this.error(`config.mounts[${index}]: content must be a string`);
            }
          });
        }
      }

      // Validate variables if present
      if (data.variables) {
        if (typeof data.variables !== "object" || Array.isArray(data.variables)) {
          this.error("variables must be an object");
        } else {
          // Validate variable values and helpers
          Object.entries(data.variables).forEach(([key, value]) => {
            if (typeof value !== "string") {
              this.error(`variables.${key}: must be a string`);
              return;
            }

            // Validate helpers in variable values
            const helperPattern = /\${([^}]+)}/g;
            let match: RegExpExecArray | null;
            while ((match = helperPattern.exec(value)) !== null) {
              const helper = match[1];
              this.validateHelper(helper, `variables.${key}`);
            }
          });

          // Try to process variables to ensure they resolve correctly
          try {
            const schema: Schema = {};
            const processedVars = processVariables(data.variables, schema);
            
            // Check if any variables failed to resolve (still contain ${})
            Object.entries(processedVars).forEach(([key, value]) => {
              if (typeof value === "string" && value.includes("${")) {
                // Check if it's a valid variable reference or an error
                const unresolved = value.match(/\${([^}]+)}/g);
                if (unresolved) {
                  unresolved.forEach((unresolvedVar) => {
                    const varName = unresolvedVar.slice(2, -1);
                    // Check if it's a reference to another variable that exists
                    if (!data.variables![varName] && !varName.includes(":")) {
                      this.warning(
                        `variables.${key}: contains unresolved variable reference '${unresolvedVar}'`
                      );
                    }
                  });
                }
              }
            });

            // Validate that domains can be processed with resolved variables
            if (data.config.domains) {
              data.config.domains.forEach((domain, index) => {
                if (domain.host && typeof domain.host === "string") {
                  try {
                    const processedHost = processValue(domain.host, processedVars, schema);
                    if (processedHost.includes("${")) {
                      this.warning(
                        `domain[${index}].host: could not fully resolve all variables. Result: ${processedHost}`
                      );
                    }
                  } catch (e: any) {
                    this.warning(
                      `domain[${index}].host: error processing host value: ${e.message}`
                    );
                  }
                }
              });
            }

            // Validate that env vars can be processed
            if (data.config.env) {
              if (Array.isArray(data.config.env)) {
                data.config.env.forEach((env, index) => {
                  if (typeof env === "string") {
                    try {
                      const processed = processValue(env, processedVars, schema);
                      if (processed.includes("${")) {
                        this.warning(
                          `config.env[${index}]: could not fully resolve all variables`
                        );
                      }
                    } catch (e: any) {
                      this.warning(
                        `config.env[${index}]: error processing env value: ${e.message}`
                      );
                    }
                  }
                });
              } else if (typeof data.config.env === "object") {
                Object.entries(data.config.env).forEach(([key, value]) => {
                  if (typeof value === "string") {
                    try {
                      const processed = processValue(value, processedVars, schema);
                      if (processed.includes("${")) {
                        this.warning(
                          `config.env.${key}: could not fully resolve all variables`
                        );
                      }
                    } catch (e: any) {
                      this.warning(
                        `config.env.${key}: error processing env value: ${e.message}`
                      );
                    }
                  }
                });
              }
            }

            // Validate that mounts can be processed
            if (data.config.mounts) {
              data.config.mounts.forEach((mount, index) => {
                if (mount.filePath && typeof mount.filePath === "string") {
                  try {
                    const processed = processValue(mount.filePath, processedVars, schema);
                    if (processed.includes("${")) {
                      this.warning(
                        `config.mounts[${index}].filePath: could not fully resolve all variables`
                      );
                    }
                  } catch (e: any) {
                    this.warning(
                      `config.mounts[${index}].filePath: error processing filePath: ${e.message}`
                    );
                  }
                }
                if (mount.content && typeof mount.content === "string") {
                  try {
                    const processed = processValue(mount.content, processedVars, schema);
                    if (processed.includes("${")) {
                      this.warning(
                        `config.mounts[${index}].content: could not fully resolve all variables`
                      );
                    }
                  } catch (e: any) {
                    this.warning(
                      `config.mounts[${index}].content: error processing content: ${e.message}`
                    );
                  }
                }
              });
            }

            if (this.options.verbose) {
              this.log("✅ Variables processed successfully", "success");
              this.log(`📋 Processed ${Object.keys(processedVars).length} variables`, "debug");
            }
          } catch (e: any) {
            this.error(`Failed to process variables: ${e.message}`);
          }
        }
      }

      return this.errors.length === 0;
    } catch (error: any) {
      this.error(`Error validating template.toml: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate a template directory
   */
  private validateTemplateDir(templateDir: string): ValidationResult {
    // Resolver rutas absolutas o relativas desde la raíz del proyecto
    const resolvedDir = path.isAbsolute(templateDir)
      ? templateDir
      : path.resolve(process.cwd(), templateDir);

    const templatePath = path.join(resolvedDir, "template.toml");
    const composePath = path.join(resolvedDir, "docker-compose.yml");

    this.log(`Validating template: ${path.basename(resolvedDir)}`);

    // Parse compose services first
    const composeServices = this.parseComposeServices(composePath);

    // Validate template.toml
    const isValid = this.validateTemplate(templatePath, composeServices);

    // Show summary
    if (isValid && this.errors.length === 0) {
      this.log("Template structure is valid", "success");

      // Show domains info
      try {
        const content = fs.readFileSync(templatePath, "utf8");
        const data = parse(content) as TemplateData;
        if (data.config && data.config.domains) {
          this.log("📋 Domains configured:");
          data.config.domains.forEach((domain) => {
            const service = domain.serviceName || "N/A";
            const port = domain.port !== undefined ? domain.port : "N/A";
            const host = domain.host || "N/A";
            this.log(`   - Service: ${service}, Port: ${port}, Host: ${host}`);
          });
        }
      } catch (e) {
        // Ignore errors in summary
      }
    }

    return {
      valid: isValid && this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Main validation method
   */
  validate(): ValidationResult {
    if (!this.options.templateDir) {
      this.error("templateDir option is required");
      if (this.options.exitOnError) {
        process.exit(1);
      }
      return { valid: false, errors: this.errors, warnings: this.warnings };
    }

    const result = this.validateTemplateDir(this.options.templateDir!);

    if (!result.valid && this.options.exitOnError) {
      process.exit(1);
    }

    return result;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: TemplateValidatorOptions = {};
  let templateDir: string | null = null;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dir":
      case "-d":
        templateDir = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: tsx validate-template.ts [options]

Options:
  -d, --dir <path>     Template directory path (required)
  -v, --verbose        Verbose output
  -h, --help           Show this help message

Examples:
  tsx validate-template.ts --dir blueprints/grafana
  tsx validate-template.ts -d blueprints/grafana --verbose
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

  const validator = new TemplateValidator({
    templateDir,
    ...options,
  });

  const result = validator.validate();

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}

export default TemplateValidator;

