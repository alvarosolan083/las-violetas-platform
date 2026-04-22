-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_ticketId_fkey";

-- AlterTable
ALTER TABLE "TicketAttachment" ADD COLUMN     "uploadedById" TEXT;

-- CreateIndex
CREATE INDEX "TicketAttachment_uploadedById_idx" ON "TicketAttachment"("uploadedById");

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
