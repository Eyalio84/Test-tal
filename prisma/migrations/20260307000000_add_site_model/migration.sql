-- CreateTable
CREATE TABLE IF NOT EXISTS "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Site',
    "themeId" TEXT NOT NULL DEFAULT 'jewelry',
    "ownerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add siteId to Product (nullable)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "siteId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add siteId to SiteContent (nullable to support legacy rows)
ALTER TABLE "SiteContent" ADD COLUMN IF NOT EXISTS "siteId" TEXT;

-- AlterTable: add siteId to SiteSnapshot (nullable to support legacy rows)
ALTER TABLE "SiteSnapshot" ADD COLUMN IF NOT EXISTS "siteId" TEXT;

-- AddForeignKey
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSnapshot" ADD CONSTRAINT "SiteSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
