-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('HOTEL', 'TRIP');

-- CreateTable
CREATE TABLE "SubAdminPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "PermissionScope" NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "SubAdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubAdminPermission_userId_scope_resourceId_key" ON "SubAdminPermission"("userId", "scope", "resourceId");

-- AddForeignKey
ALTER TABLE "SubAdminPermission" ADD CONSTRAINT "SubAdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
