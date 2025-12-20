/*
  Warnings:

  - You are about to drop the column `hotelId` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `roomTypeId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_hotelId_fkey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "hotelId",
ADD COLUMN     "roomTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxGuests" INTEGER NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
