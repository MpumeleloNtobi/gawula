import { validateEnv } from "./env.validation";

describe("validateEnv", () => {
  const strongSecret = "a".repeat(32);

  it("returns config unchanged outside production", () => {
    const config = { NODE_ENV: "development" };
    expect(validateEnv(config)).toBe(config);
  });

  it("throws when required vars are missing in production", () => {
    expect(() => validateEnv({ NODE_ENV: "production" })).toThrow(
      /Missing required environment variables/,
    );
  });

  it("throws on a weak JWT secret in production", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://x",
        REDIS_URL: "redis://x",
        JWT_ACCESS_SECRET: "short",
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it("throws on a known insecure JWT secret value", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://x",
        REDIS_URL: "redis://x",
        JWT_ACCESS_SECRET: "dev-insecure-secret-change-me",
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it("passes with a strong secret and all required vars in production", () => {
    const config = {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://x",
      REDIS_URL: "redis://x",
      JWT_ACCESS_SECRET: strongSecret,
    };
    expect(validateEnv(config)).toBe(config);
  });
});
