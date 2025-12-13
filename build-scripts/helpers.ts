import { randomBytes } from "crypto";

/**
 * Simple schema interface for domain generation
 */
export interface Schema {
	domain?: string;
}

/**
 * Generate a random domain
 */
export function generateRandomDomain(schema: Schema = {}): string {
	const random = randomBytes(8).toString("hex");
	return schema.domain || `app-${random}.example.com`;
}

/**
 * Generate base64 encoded random string
 */
export function generateBase64(length: number = 32): string {
	const bytes = randomBytes(length);
	return bytes.toString("base64");
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 16): string {
	const charset =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
	let password = "";
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return password;
}

/**
 * Generate a random hash
 */
export function generateHash(length: number = 8): string {
	const bytes = randomBytes(length);
	return bytes.toString("hex");
}

/**
 * Generate a JWT token (simplified version)
 */
export function generateJwt(options?: {
	length?: number;
	secret?: string;
	payload?: any;
}): string {
	if (options?.length) {
		// Legacy format: jwt:length
		return randomBytes(options.length).toString("hex");
	}

	// For now, return a simple token
	// In a real implementation, this would use a JWT library
	const payload = options?.payload || {};
	const secret = options?.secret || generatePassword(32);
	
	// Simple base64 encoding (not a real JWT, but good enough for validation)
	const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = Buffer.from(secret).toString("base64url").slice(0, 32);
	
	return `${header}.${body}.${signature}`;
}

/**
 * Process a string value and replace variables (based on Dokploy's processValue)
 */
export function processValue(
	value: string,
	variables: Record<string, string>,
	schema: Schema = {}
): string {
	if (!value) return value;

	// First replace utility functions
	let processedValue = value.replace(/\${([^}]+)}/g, (match, varName) => {
		// Handle utility functions
		if (varName === "domain") {
			return generateRandomDomain(schema);
		}

		if (varName === "base64") {
			return generateBase64(32);
		}
		if (varName.startsWith("base64:")) {
			const length = Number.parseInt(varName.split(":")[1], 10) || 32;
			return generateBase64(length);
		}

		if (varName.startsWith("password:")) {
			const length = Number.parseInt(varName.split(":")[1], 10) || 16;
			return generatePassword(length);
		}
		if (varName === "password") {
			return generatePassword(16);
		}

		if (varName.startsWith("hash:")) {
			const length = Number.parseInt(varName.split(":")[1], 10) || 8;
			return generateHash(length);
		}
		if (varName === "hash") {
			return generateHash();
		}

		if (varName === "uuid") {
			return crypto.randomUUID();
		}

		if (varName === "timestamp" || varName === "timestampms") {
			return Date.now().toString();
		}

		if (varName === "timestamps") {
			return Math.round(Date.now() / 1000).toString();
		}

		if (varName.startsWith("timestampms:")) {
			return new Date(varName.slice(12)).getTime().toString();
		}
		if (varName.startsWith("timestamps:")) {
			return Math.round(new Date(varName.slice(11)).getTime() / 1000).toString();
		}

		if (varName === "randomPort") {
			return Math.floor(Math.random() * 65535).toString();
		}

		if (varName === "jwt") {
			return generateJwt();
		}

		if (varName.startsWith("jwt:")) {
			const params: string[] = varName.split(":").slice(1);
			if (params.length === 1 && params[0] && params[0].match(/^\d{1,3}$/)) {
				return generateJwt({ length: Number.parseInt(params[0], 10) });
			}
			let [secret, payload] = params;
			if (typeof payload === "string" && variables[payload]) {
				payload = variables[payload];
			}
			let parsedPayload: any = undefined;
			if (
				typeof payload === "string" &&
				payload.trimStart().startsWith("{") &&
				payload.trimEnd().endsWith("}")
			) {
				try {
					parsedPayload = JSON.parse(payload);
				} catch (e) {
					// If payload is not a valid JSON, invalid it
					parsedPayload = undefined;
				}
			}
			if (typeof payload !== "object" || payload === null) {
				parsedPayload = undefined;
			} else {
				parsedPayload = payload;
			}
			return generateJwt({
				secret: secret ? variables[secret] || secret : undefined,
				payload: parsedPayload,
			});
		}

		if (varName === "username") {
			// Simple username generator (without faker)
			const adjectives = ["cool", "smart", "fast", "quick", "super", "mega"];
			const nouns = ["user", "admin", "dev", "test", "demo", "guest"];
			const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
			const noun = nouns[Math.floor(Math.random() * nouns.length)];
			const num = Math.floor(Math.random() * 1000);
			return `${adj}${noun}${num}`.toLowerCase();
		}

		if (varName === "email") {
			// Simple email generator (without faker)
			const domains = ["example.com", "test.com", "demo.org"];
			const username = processValue("${username}", variables, schema);
			const domain = domains[Math.floor(Math.random() * domains.length)];
			return `${username}@${domain}`.toLowerCase();
		}

		// If not a utility function, try to get from variables
		return variables[varName] || match;
	});

	// Then replace any remaining ${var} with their values from variables
	processedValue = processedValue.replace(/\${([^}]+)}/g, (match, varName) => {
		// Check if variable exists (even if it's an empty string)
		if (varName in variables) {
			return variables[varName];
		}
		return match;
	});

	return processedValue;
}

/**
 * Process variables in a template (based on Dokploy's processVariables)
 */
export function processVariables(
	variables: Record<string, string>,
	schema: Schema = {}
): Record<string, string> {
	const processed: Record<string, string> = {};

	// First pass: Process some variables that don't depend on other variables
	for (const [key, value] of Object.entries(variables)) {
		if (typeof value !== "string") continue;

		if (value === "${domain}") {
			processed[key] = generateRandomDomain(schema);
		} else if (value.startsWith("${base64:")) {
			const match = value.match(/\${base64:(\d+)}/);
			const length = match?.[1] ? Number.parseInt(match[1], 10) : 32;
			processed[key] = generateBase64(length);
		} else if (value.startsWith("${password:")) {
			const match = value.match(/\${password:(\d+)}/);
			const length = match?.[1] ? Number.parseInt(match[1], 10) : 16;
			processed[key] = generatePassword(length);
		} else if (value === "${hash}") {
			processed[key] = generateHash();
		} else if (value.startsWith("${hash:")) {
			const match = value.match(/\${hash:(\d+)}/);
			const length = match?.[1] ? Number.parseInt(match[1], 10) : 8;
			processed[key] = generateHash(length);
		} else {
			processed[key] = value;
		}
	}

	// Second pass: Process variables that reference other variables
	for (const [key, value] of Object.entries(processed)) {
		processed[key] = processValue(value, processed, schema);
	}

	return processed;
}

