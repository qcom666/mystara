import { defineConfig } from "prisma/config";

// Used only by db/mystara/studio.ps1 to browse the `mystara` database in Prisma Studio.
// The schema next to this file is generated from the live database (`prisma db pull`),
// it is NOT the application's schema (that is prisma/schema.prisma).
export default defineConfig({
  schema: "schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
