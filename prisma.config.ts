// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

console.log("🔍 DATABASE_URL loaded:", process.env.DATABASE_URL ? "✅ YES" : "❌ NO");

export default defineConfig({
  schema: "./prisma/schema.prisma",

  datasource: {
    url: process.env.DATABASE_URL,
  },

  migrations: {
    path: "./prisma/migrations",
  },
});