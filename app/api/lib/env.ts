import "dotenv/config";

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  appId: process.env.APP_ID ?? "",
  appSecret: process.env.APP_SECRET ?? "",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: optional("DATABASE_URL"),
  kimiAuthUrl: process.env.KIMI_AUTH_URL ?? "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL ?? "",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  jwtSecret:
    process.env.JWT_SECRET ?? "bookhaven-secret-key-change-in-production",
};
