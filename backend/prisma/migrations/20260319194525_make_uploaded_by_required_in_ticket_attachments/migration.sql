/*
  Warnings:

  - Made the column `uploadedById` on table `TicketAttachment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_uploadedById_fkey";

-- AlterTable
ALTER TABLE "TicketAttachment" ALTER COLUMN "uploadedById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
