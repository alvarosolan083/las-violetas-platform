import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@test.com';

    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        throw new Error(`No existe el usuario ${adminEmail}. Crea el usuario primero o cambia el email en seed.ts`);
    }

    // 1) Crear condominio (o reutilizar si ya existe)
    const condo = await prisma.condominium.upsert({
        where: { id: 'violetas-condo' },
        update: {},
        create: {
            id: 'violetas-condo',
            name: 'Condominio Las Violetas',
            address: 'Santiago, Chile',
        },
    });

    // 2) Membresía del usuario al condominio (ADMINISTRADOR)
    await prisma.condoMembership.upsert({
        where: {
            condominiumId_userId: {
                condominiumId: condo.id,
                userId: user.id,
            },
        },
        update: {
            role: 'ADMINISTRADOR',
            active: true,
        },
        create: {
            condominiumId: condo.id,
            userId: user.id,
            role: 'ADMINISTRADOR',
            active: true,
        },
    });

    console.log('✅ Seed OK');
    console.log('condoId =>', condo.id);
    console.log('userId  =>', user.id);
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
