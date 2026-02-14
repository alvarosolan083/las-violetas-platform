-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "priorityUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "priorityUpdatedById" TEXT,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_statusUpdatedById_fkey" FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_priorityUpdatedById_fkey" FOREIGN KEY ("priorityUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
