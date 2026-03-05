import { PrismaClient } from "@/app/generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Prisma v6: direct SQLite via prisma.config.ts — no adapter/accelerateUrl needed at runtime
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prisma v6 type requires adapter|accelerateUrl but direct connection works via prisma.config.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
