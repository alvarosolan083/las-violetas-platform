import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";

function parseDay(dateIso: string) {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
        throw new BadRequestException("Fecha inválida");
    }
    return d;
}

function combineDateAndTimeUTC(date: Date, hhmm: string) {
    const [hh, mm] = hhmm.split(":").map((x) => Number(x));

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
        throw new BadRequestException("Hora inválida");
    }

    const dt = new Date(date);
    dt.setUTCHours(hh, mm, 0, 0);
    return dt;
}

@Injectable()
export class ReservationsService {
    constructor(private readonly prisma: PrismaService) { }

    async listMine(condoId: string, userId: string, tab: "future" | "past") {
        const now = new Date();

        const whereBase = {
            condominiumId: condoId,
            createdById: userId,
        };

        const where =
            tab === "future"
                ? { ...whereBase, startAt: { gte: now } }
                : { ...whereBase, startAt: { lt: now } };

        const items = await this.prisma.reservation.findMany({
            where,
            orderBy: {
                startAt: tab === "future" ? "asc" : "desc",
            },
            include: {
                commonSpace: true,
                slot: true,
            },
        });

        return { items };
    }

    async listAll(
        condoId: string,
        params: {
            status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
            spaceId?: string;
            date?: string;
            q?: string;
            page?: number;
            pageSize?: number;
        },
    ) {
        const page = Math.max(1, Number(params.page ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(params.pageSize ?? 10)));
        const skip = (page - 1) * pageSize;

        const where: any = {
            condominiumId: condoId,
        };

        if (params.q) {
            const q = params.q.trim();

            where.OR = [
                {
                    id: {
                        contains: q,
                        mode: "insensitive",
                    },
                },
                {
                    commonSpace: {
                        name: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    createdBy: {
                        name: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    createdBy: {
                        email: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                },
            ];
        }

        if (params.status) {
            where.status = params.status;
        }

        if (params.spaceId) {
            where.commonSpaceId = params.spaceId;
        }

        if (params.date) {
            where.date = parseDay(params.date);
        }

        const [items, total] = await Promise.all([
            this.prisma.reservation.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
                include: {
                    commonSpace: true,
                    slot: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.reservation.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
    }

    async getAvailability(condoId: string, spaceId: string, date: string) {
        if (!date) {
            throw new BadRequestException("Debes enviar la fecha en query param");
        }

        const day = parseDay(date);

        const space = await this.prisma.commonSpace.findFirst({
            where: {
                id: spaceId,
                condominiumId: condoId,
            },
            include: {
                slots: {
                    orderBy: { startTime: "asc" },
                },
            },
        });

        if (!space) {
            throw new NotFoundException("Espacio común no encontrado");
        }

        const reservations = await this.prisma.reservation.findMany({
            where: {
                condominiumId: condoId,
                commonSpaceId: space.id,
                date: day,
                status: {
                    in: ["PENDING", "APPROVED"],
                },
            },
            select: {
                slotId: true,
                status: true,
            },
        });

        const reservationBySlot = new Map(
            reservations.map((r) => [r.slotId, r.status] as const),
        );

        const slots = space.slots.map((slot) => {
            const reservationStatus = reservationBySlot.get(slot.id);

            let status: "AVAILABLE" | "PENDING" | "BOOKED" = "AVAILABLE";

            if (reservationStatus === "PENDING") {
                status = "PENDING";
            }

            if (reservationStatus === "APPROVED") {
                status = "BOOKED";
            }

            return {
                slotId: slot.id,
                label: slot.label,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status,
            };
        });

        return {
            date,
            spaceId: space.id,
            spaceName: space.name,
            slots,
        };
    }

    async createForCondo(condoId: string, userId: string, dto: CreateReservationDto) {
        const space = await this.prisma.commonSpace.findFirst({
            where: {
                id: dto.spaceId,
                condominiumId: condoId,
            },
            include: {
                slots: true,
            },
        });

        if (!space) {
            throw new NotFoundException("Espacio común no encontrado");
        }

        const slot = space.slots.find((s) => s.id === dto.slotId);

        if (!slot) {
            throw new BadRequestException("Bloque (slot) no válido para este espacio");
        }

        const day = parseDay(dto.date);
        const startAt = combineDateAndTimeUTC(day, slot.startTime);
        let endAt = combineDateAndTimeUTC(day, slot.endTime);

        if (endAt <= startAt) {
            endAt.setUTCDate(endAt.getUTCDate() + 1);
        }

        if (space.seasonStart && startAt < space.seasonStart) {
            throw new BadRequestException("Fuera de temporada");
        }

        if (space.seasonEnd && startAt > space.seasonEnd) {
            throw new BadRequestException("Fuera de temporada");
        }

        if (space.allowedWeekdays?.length) {
            const weekday = startAt.getUTCDay();
            if (!space.allowedWeekdays.includes(weekday)) {
                throw new BadRequestException("Día no habilitado para este espacio");
            }
        }

        if (space.advanceHours && space.advanceHours > 0) {
            const minStart = new Date(Date.now() + space.advanceHours * 60 * 60 * 1000);

            if (startAt < minStart) {
                throw new BadRequestException(
                    `Debes reservar con ${space.advanceHours}h de anticipación`,
                );
            }
        }

        const clash = await this.prisma.reservation.findFirst({
            where: {
                condominiumId: condoId,
                commonSpaceId: space.id,
                slotId: slot.id,
                date: day,
                status: {
                    in: ["PENDING", "APPROVED"],
                },
            },
        });

        if (clash) {
            throw new BadRequestException("Ese bloque ya está reservado");
        }

        if (space.dailyLimit && space.dailyLimit > 0) {
            const startOfDay = new Date(day);
            const endOfDay = new Date(day);
            endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

            const dailyCount = await this.prisma.reservation.count({
                where: {
                    condominiumId: condoId,
                    commonSpaceId: space.id,
                    createdById: userId,
                    startAt: { gte: startOfDay, lt: endOfDay },
                    status: { in: ["PENDING", "APPROVED"] },
                },
            });

            if (dailyCount >= space.dailyLimit) {
                throw new BadRequestException(
                    `Límite diario alcanzado (${space.dailyLimit})`,
                );
            }
        }

        if (space.weeklyLimit && space.weeklyLimit > 0) {
            const startWindow = new Date(day);
            startWindow.setUTCDate(startWindow.getUTCDate() - 6);

            const endWindow = new Date(day);
            endWindow.setUTCDate(endWindow.getUTCDate() + 1);

            const weeklyCount = await this.prisma.reservation.count({
                where: {
                    condominiumId: condoId,
                    commonSpaceId: space.id,
                    createdById: userId,
                    startAt: { gte: startWindow, lt: endWindow },
                    status: { in: ["PENDING", "APPROVED"] },
                },
            });

            if (weeklyCount >= space.weeklyLimit) {
                throw new BadRequestException(
                    `Límite semanal alcanzado (${space.weeklyLimit})`,
                );
            }
        }

        const created = await this.prisma.reservation.create({
            data: {
                condominiumId: condoId,
                commonSpaceId: space.id,
                slotId: slot.id,
                date: day,
                startAt,
                endAt,
                status: space.requiresApproval ? "PENDING" : "APPROVED",
                createdById: userId,
            },
            include: {
                commonSpace: true,
                slot: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return {
            ...created,
            cancelDeadline: space.cancelBeforeHours
                ? new Date(
                    created.startAt.getTime() -
                    space.cancelBeforeHours * 60 * 60 * 1000,
                )
                : null,
        };
    }

    async cancel(condoId: string, userId: string, reservationId: string) {
        const res = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                condominiumId: condoId,
            },
            include: {
                commonSpace: true,
            },
        });

        if (!res) {
            throw new NotFoundException("Reserva no encontrada");
        }

        if (res.createdById !== userId) {
            throw new ForbiddenException("No puedes cancelar reservas de otro usuario");
        }

        if (res.status === "CANCELLED") {
            return res;
        }

        if (res.status === "REJECTED") {
            throw new BadRequestException("No puedes cancelar una reserva rechazada");
        }

        const h = res.commonSpace.cancelBeforeHours ?? 0;

        if (h > 0) {
            const deadline = new Date(res.startAt.getTime() - h * 60 * 60 * 1000);

            if (new Date() > deadline) {
                throw new BadRequestException(
                    "Ya pasó el plazo para cancelar esta reserva",
                );
            }
        }

        return this.prisma.reservation.update({
            where: { id: res.id },
            data: { status: "CANCELLED" },
        });
    }

    async approve(condoId: string, decidedById: string, reservationId: string) {
        const res = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                condominiumId: condoId,
            },
        });

        if (!res) {
            throw new NotFoundException("Reserva no encontrada");
        }

        if (res.status !== "PENDING") {
            throw new BadRequestException(
                "Solo se pueden aprobar reservas pendientes",
            );
        }

        return this.prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: "APPROVED",
                decidedById,
                decidedAt: new Date(),
            },
        });
    }

    async reject(condoId: string, decidedById: string, reservationId: string) {
        const res = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                condominiumId: condoId,
            },
        });

        if (!res) {
            throw new NotFoundException("Reserva no encontrada");
        }

        if (res.status !== "PENDING") {
            throw new BadRequestException(
                "Solo se pueden rechazar reservas pendientes",
            );
        }

        return this.prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: "REJECTED",
                decidedById,
                decidedAt: new Date(),
            },
        });
    }
}