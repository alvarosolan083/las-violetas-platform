/*
  Warnings:

  - You are about to drop the column `filename` on the `TicketAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `TicketAttachment` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `TicketAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `TicketAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `TicketAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `TicketAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `TicketAttachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketAttachment" DROP COLUMN "filename",
DROP COLUMN "url",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL;
