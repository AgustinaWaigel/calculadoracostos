import "server-only";
import { PrismaClient } from "@prisma/client";

// Un solo cliente en desarrollo (Next recarga módulos en caliente).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
