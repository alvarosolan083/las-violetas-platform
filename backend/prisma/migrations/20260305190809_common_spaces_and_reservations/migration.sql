-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CommonSpace" (
    "id" TEXT NOT NULL,
    "condominiumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "advanceHours" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 0,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "cancelBeforeHours" INTEGER NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "seasonStart" TIMESTAMP(3),
    "seasonEnd" TIMESTAMP(3),
    "allowedWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommonSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonSpaceSlot" (
    "id" TEXT NOT NULL,
    "commonSpaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "CommonSpaceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "condominiumId" TEXT NOT NULL,
    "commonSpaceId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommonSpace_condominiumId_idx" ON "CommonSpace"("condominiumId");

-- CreateIndex
CREATE INDEX "CommonSpaceSlot_commonSpaceId_idx" ON "CommonSpaceSlot"("commonSpaceId");

-- CreateIndex
CREATE INDEX "Reservation_condominiumId_idx" ON "Reservation"("condominiumId");

-- CreateIndex
CREATE INDEX "Reservation_commonSpaceId_idx" ON "Reservation"("commonSpaceId");

-- CreateIndex
CREATE INDEX "Reservation_slotId_idx" ON "Reservation"("slotId");

-- CreateIndex
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");

-- CreateIndex
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- AddForeignKey
ALTER TABLE "CommonSpace" ADD CONSTRAINT "CommonSpace_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonSpaceSlot" ADD CONSTRAINT "CommonSpaceSlot_commonSpaceId_fkey" FOREIGN KEY ("commonSpaceId") REFERENCES "CommonSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_commonSpaceId_fkey" FOREIGN KEY ("commonSpaceId") REFERENCES "CommonSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "CommonSpaceSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
