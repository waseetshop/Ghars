import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrate, db pull, studio) يستخدم هذا الـ URL
    // يجب أن يكون DIRECT_URL (port 5432) — Transaction pooler لا يدعم DDL statements
    url: process.env["DIRECT_URL"]!,
  },
});
