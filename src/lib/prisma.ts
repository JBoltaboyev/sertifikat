import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const dbPath = path.resolve(process.cwd(), "dev.db");
  return `file:${dbPath}`;
};

const adapter = new PrismaLibSql({
  url: getDatabaseUrl(),
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
