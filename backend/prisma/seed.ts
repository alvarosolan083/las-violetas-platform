import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Iniciando seeding...");

    // ------------------------------------------------
    // 1) Usuarios de prueba
    // ------------------------------------------------
    const testUsers = [
        {
            email: "admin@test.com",
            password: "admin123",
            name: "Admin Test",
            role: "ADMIN" as const,
            condoRole: "ADMINISTRADOR" as const
        },
        {
            email: "comite@test.com",
            password: "comite123",
            name: "Comité Test",
            role: "COMITE" as const,
            condoRole: "COMITE" as const
        },
        {
            email: "copro@test.com",
            password: "copro123",
            name: "Copropietario Test",
            role: "RESIDENTE" as const,
            condoRole: "COPROPIETARIO" as const
        },
    ];

    const createdUsers: Array<{ email: string; password: string; condoRole: string; id: string }> = [];

    for (const tu of testUsers) {
        const hashedPassword = await bcrypt.hash(tu.password, 10);
        const user = await prisma.user.upsert({
            where: { email: tu.email },
            update: {},
            create: {
                email: tu.email,
                passwordHash: hashedPassword,
                name: tu.name,
                role: tu.role,
                active: true,
            },
        });
        createdUsers.push({ email: tu.email, password: tu.password, condoRole: tu.condoRole, id: user.id });
    }

    // ------------------------------------------------
    // 2) Condominio
    // ------------------------------------------------
    const condo = await prisma.condominium.upsert({
        where: { id: "violetas-condo" },
        update: {},
        create: {
            id: "violetas-condo",
            name: "Condominio Las Violetas",
            address: "Santiago, Chile",
        },
    });

    // ------------------------------------------------
    // 3) Membresías
    // ------------------------------------------------
    for (const cu of createdUsers) {
        await prisma.condoMembership.upsert({
            where: {
                condominiumId_userId: {
                    condominiumId: condo.id,
                    userId: cu.id,
                },
            },
            update: {
                role: cu.condoRole as "ADMINISTRADOR" | "COMITE" | "COPROPIETARIO",
                active: true,
            },
            create: {
                condominiumId: condo.id,
                userId: cu.id,
                role: cu.condoRole as "ADMINISTRADOR" | "COMITE" | "COPROPIETARIO",
                active: true,
            },
        });
    }

    // ------------------------------------------------
    // 4) Common Spaces + Slots
    // ------------------------------------------------

    async function upsertCommonSpace(args: {
        condominiumId: string;
        name: string;
        description?: string | null;
        price?: number;
        advanceHours?: number;
        dailyLimit?: number;
        weeklyLimit?: number;
        cancelBeforeHours?: number;
        requiresApproval?: boolean;
        seasonStart?: Date | null;
        seasonEnd?: Date | null;
        allowedWeekdays?: number[];
    }) {
        const existing = await prisma.commonSpace.findFirst({
            where: {
                condominiumId: args.condominiumId,
                name: args.name,
            },
        });

        if (existing) {
            return prisma.commonSpace.update({
                where: { id: existing.id },
                data: {
                    description: args.description ?? existing.description,
                    price: args.price ?? existing.price,
                    advanceHours: args.advanceHours ?? existing.advanceHours,
                    dailyLimit: args.dailyLimit ?? existing.dailyLimit,
                    weeklyLimit: args.weeklyLimit ?? existing.weeklyLimit,
                    cancelBeforeHours: args.cancelBeforeHours ?? existing.cancelBeforeHours,
                    requiresApproval: args.requiresApproval ?? existing.requiresApproval,
                    seasonStart: args.seasonStart ?? existing.seasonStart,
                    seasonEnd: args.seasonEnd ?? existing.seasonEnd,
                    allowedWeekdays: args.allowedWeekdays ?? existing.allowedWeekdays,
                },
            });
        }

        return prisma.commonSpace.create({
            data: {
                condominiumId: args.condominiumId,
                name: args.name,
                description: args.description ?? null,
                price: args.price ?? 0,
                advanceHours: args.advanceHours ?? 0,
                dailyLimit: args.dailyLimit ?? 0,
                weeklyLimit: args.weeklyLimit ?? 0,
                cancelBeforeHours: args.cancelBeforeHours ?? 0,
                requiresApproval: args.requiresApproval ?? true,
                seasonStart: args.seasonStart ?? null,
                seasonEnd: args.seasonEnd ?? null,
                allowedWeekdays: args.allowedWeekdays ?? [],
            },
        });
    }

    async function syncSlots(
        commonSpaceId: string,
        slots: Array<{ label: string; startTime: string; endTime: string }>
    ) {
        const existing = await prisma.commonSpaceSlot.findMany({
            where: { commonSpaceId },
        });

        const wantedLabels = slots.map((slot) => slot.label);

        // Elimina slots viejos que ya no corresponden
        const toDelete = existing.filter((item) => !wantedLabels.includes(item.label));

        if (toDelete.length > 0) {
            await prisma.commonSpaceSlot.deleteMany({
                where: {
                    id: {
                        in: toDelete.map((item) => item.id),
                    },
                },
            });
        }

        // Upsert de slots vigentes
        for (const slot of slots) {
            const found = existing.find((item) => item.label === slot.label);

            if (found) {
                await prisma.commonSpaceSlot.update({
                    where: { id: found.id },
                    data: {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    },
                });
            } else {
                await prisma.commonSpaceSlot.create({
                    data: {
                        commonSpaceId,
                        label: slot.label,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    },
                });
            }
        }
    }

    const piscinaDescription = `La pileta cuenta con una superficie de 54 mt2, donde pueden estar simultáneamente 25 personas. En el entorno de la piscina, podrán permanecer hasta 50 personas. La temporada de piscina se abre a partir del 15 de Noviembre hasta 15 de Marzo 2026. Los días que estará disponible para su uso serán los días Martes, Miércoles, Jueves, Viernes, Sábado y Domingo. El horario de uso es en dos jornadas, desde las 10:00 hasta las 15:00 y desde las 15:00 hasta las 21:00 hrs.

Restricciones:
Los residentes que requieren la reserva deben estar al día en sus gastos comunes. Quien no respete las normas de la piscina quedará inhabilitado de usarla por un período de 3 meses. Los residentes que tengan multas o infracciones al reglamento no podrán hacer uso de esta.

Prohibiciones:
Todos los ocupantes deben vestir en traje de baño y/o ropa de baño. Está prohibido usar la piscina para el aseo personal o aseo de prendas de vestir. El no cumplimiento a estas normas será causal de multa de 2 UTM, sin notificación previa. Ya sea que la infracción la cometa el copropietario o sus visitas, la multa será cursada a la unidad que corresponde.

Todo ocupante debe conocer estas normas y se entiende el conocimiento pleno de sus ocupantes. El copropietario y/o residente debe encontrarse al día en el pago de sus gastos comunes. El uso de la piscina es exclusivo para residentes del edificio, máximo 4 personas por departamento. Se autorizará solo 3 visitas por departamento en los días de semana de Lunes a Jueves.

Las visitas no pueden estar solas en el espacio común, en todo momento deben estar acompañadas por el residente responsable de la reserva. Niños menores de 12 años deben permanecer acompañados de un adulto responsable. La comunidad no cuenta con salvavidas; la seguridad de los niños es responsabilidad exclusiva de sus padres.

Por higiene y seguridad está estrictamente prohibido salir mojado del sector de piscina a otras zonas del edificio, en especial pasillos y ascensores. Será obligatorio el uso de sandalia, toalla y traje de baño. Antes de ingresar a la piscina, todo usuario debe pasar por la ducha.

No podrán ingresar a la piscina personas que porten parches o vendajes de cualquier tipo por afección a la piel. Los menores no pueden usar pañales en la piscina. Cada persona con pelo largo que ingrese a la piscina deberá tenerlo debidamente amarrado. Está prohibido escupir, sonarse, orinar o contaminar el agua de cualquier forma.

Se prohíben piqueros, juegos bruscos, pelotas, juegos inflables, flotadores u otro tipo de elementos que pudieren dificultar el uso normal por parte de los demás residentes. La comunidad no se hace responsable de accidentes ocurridos en el área de piscina, ni en el traslado ni durante el uso. Cada residente que usa el espacio es responsable de su grupo familiar e invitados.

Está prohibido el ingreso de mascotas y animales en todo el sector de la piscina. La seguridad de las pertenencias que cada usuario porte en el sector de piscina es de exclusiva responsabilidad de cada uno. La comunidad no se hace responsable de robos, pérdidas o daños de enseres ocurridos en el área de piscina.

El uso del salón común o quincho no incluye el uso de la piscina ni viceversa. No podrán ingresar a la piscina las personas que estén bajo el efecto del alcohol, drogas u otros estupefacientes. Se prohíbe el consumo de alcohol y comida en todo el sector de piscina. Está estrictamente prohibido fumar dentro del sector de piscina, jardines y pileta.

El sector de piscina y sus alrededores no son lugar para jugar. Cualquier accidente en estas dependencias no es responsabilidad del edificio ni de sus encargados. Es exclusivamente responsabilidad de los padres y apoderados de cada departamento el cuidado y seguridad de sus hijos, familiares y visitas.

En todo momento se debe mantener el respeto y las buenas costumbres entre usuarios y demás residentes; por lo tanto, se deberán evitar las groserías, gritos, música, cantos y juegos bruscos que pudieren alterar la convivencia, quedando estrictamente prohibidos actos obscenos e indecorosos que afecten la moral y buenas costumbres.

El residente solo debe reservar una vez por día, ya sea en la mañana o en la tarde. Si un bloque se encuentra libre, se debe reservar y esperar aprobación de administración.

Aclaración:
Se define como sector de piscina el área cercada por la reja de la piscina y sus jardines aledaños. En temporada de funcionamiento el horario de uso de la piscina será entre las 10:00 horas y las 21:00 horas, quedando cerrada en los días y momentos destinados a su mantención. Las reservas solo serán a través de la aplicación de Comunidad Feliz.`;

    const quinchoDescription = `Capacidad para 10 personas (incluyendo a los residentes).

OBLIGATORIO:
Previo al retiro de llaves para el uso, deberá haber enviado el listado de invitados, indicando: Nombre, Rut y Patente (si corresponde) al correo conserjeria079@gmail.com.
Se debe dejar garantía por uso de $50.000, la que será devuelta a la entrega intacta y limpia del Quincho.

Restricciones:
No se pueden pegar globos a los pilares ni techo con cinta adhesiva; estos deben ser retirados a la entrega sin dejar rastros.
Las visitas sólo deben transitar hacia el quincho y no pueden circular por los espacios comunes libremente.
No puede hacer uso de más de 1 Quincho a la vez.
Debe respetar el horario máximo de uso.
El uso del salón común no incluye el uso de la piscina ni viceversa.
No se permiten más de 2 estacionamientos de visita por quincho.

IMPORTANTE:
El Quincho debe devolverse limpio en todos los lugares y sus instalaciones, esto incluye baños, ventanas, pisos, muebles, aparatos electrónicos, etc.

Disposición:
Domingo a Jueves 10:00 a 22:00 hrs.
Viernes, Sábado y Víspera de Festivos 10:00 a 02:00 hrs.`;

    const salonDescription = `Capacidad para 20 personas (incluyendo a los residentes).

OBLIGATORIO:
Previo al retiro de llaves para el uso, deberá haber enviado el listado de invitados, indicando: Nombre, Rut y Patente (si corresponde) al correo conserjeria079@gmail.com.
Se debe dejar garantía por uso de $50.000, la que será devuelta a la entrega intacta del salón de eventos.

Restricciones:
No se pueden pegar globos a los muros ni cielo, sólo en ventanas, y deben ser retirados a la entrega sin dejar rastros.
Las visitas sólo deben transitar hacia el salón y no pueden circular por los espacios comunes libremente.
Debe respetar el horario máximo de uso.
El uso del salón común no incluye el uso de la piscina ni viceversa.
No se permiten más de 2 estacionamientos de visita por salón.

IMPORTANTE:
El salón debe devolverse limpio en todos los lugares y sus instalaciones, esto incluye baños, ventanas, pisos, muebles, aparatos electrónicos, etc.

Disposición:
Domingo a Jueves 10:00 a 22:00 hrs.
Viernes, Sábado y Víspera de Festivos 10:00 a 02:00 hrs.`;

    // Piscina
    const piscina = await upsertCommonSpace({
        condominiumId: condo.id,
        name: "Piscina",
        description: piscinaDescription,
        price: 0,
        advanceHours: 12,
        dailyLimit: 1,
        weeklyLimit: 7,
        cancelBeforeHours: 2,
        requiresApproval: true,
        seasonStart: new Date("2025-11-15T00:00:00.000Z"),
        seasonEnd: new Date("2026-03-15T23:59:59.000Z"),
        allowedWeekdays: [0, 2, 3, 4, 5, 6],
    });

    await syncSlots(piscina.id, [
        { label: "10:00 - 14:45", startTime: "10:00", endTime: "14:45" },
        { label: "15:00 - 21:00", startTime: "15:00", endTime: "21:00" },
    ]);

    // Quinchos
    const quinchoNames = ["Quincho 1", "Quincho 2", "Quincho 3"];

    for (const name of quinchoNames) {
        const quincho = await upsertCommonSpace({
            condominiumId: condo.id,
            name,
            description: quinchoDescription,
            price: 0,
            advanceHours: 48,
            dailyLimit: 1,
            weeklyLimit: 1,
            cancelBeforeHours: 12,
            requiresApproval: true,
            allowedWeekdays: [],
        });

        await syncSlots(quincho.id, [
            { label: "10:00 - 22:00", startTime: "10:00", endTime: "22:00" },
            { label: "10:00 - 02:00", startTime: "10:00", endTime: "02:00" },
        ]);
    }

    // Salones
    const salonNames = ["Salón de Eventos Norte", "Salón de Eventos Sur"];

    for (const name of salonNames) {
        const salon = await upsertCommonSpace({
            condominiumId: condo.id,
            name,
            description: salonDescription,
            price: 0,
            advanceHours: 48,
            dailyLimit: 1,
            weeklyLimit: 1,
            cancelBeforeHours: 12,
            requiresApproval: true,
            allowedWeekdays: [],
        });

        await syncSlots(salon.id, [
            { label: "10:00 - 22:00", startTime: "10:00", endTime: "22:00" },
        ]);
    }

    console.log("---");
    console.log("✅ Seed finalizado con éxito");
    console.log(`🏠 Condominio ID: ${condo.id}`);
    console.log("👥 Credenciales generadas:");
    for (const user of createdUsers) {
        console.log(`  - Rol: ${user.condoRole.padEnd(13)} | Email: ${user.email} | Pass: ${user.password}`);
    }
    console.log("🗓️ CommonSpaces: Piscina / Quinchos / Salones + Slots generados.");
    console.log("---");
}

main()
    .catch((e) => {
        console.error("❌ Error en el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
