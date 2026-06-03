const REQUIRED_IN_PRODUCTION = ["DATABASE_URL", "JWT_ACCESS_SECRET", "REDIS_URL"] as const;

const INSECURE_VALUES = new Set(["dev-insecure-secret-change-me", "change-me", "secret"]);

export function validateEnv(config: Record<string, unknown>) {
  const isProduction = config.NODE_ENV === "production";

  if (isProduction) {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !config[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(", ")}`,
      );
    }

    const jwtSecret = String(config.JWT_ACCESS_SECRET ?? "");
    if (jwtSecret.length < 32 || INSECURE_VALUES.has(jwtSecret)) {
      throw new Error(
        "JWT_ACCESS_SECRET must be a strong secret (>= 32 chars) in production. Generate one with: openssl rand -hex 32",
      );
    }
  }

  return config;
}
