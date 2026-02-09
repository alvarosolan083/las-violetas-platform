import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@test.com';

    // Generamos el hash para la contraseña 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log('🌱 Iniciando seeding...');

    // 1) Crear o encontrar el usuario Admin (Autónomo)
    // Usamos 'passwordHash' para coincidir con tu schema.prisma
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            name: 'Admin Test',
            role: 'ADMIN', // Asegúrate de que 'ADMIN' esté en tu enum Role
            active: true,
        },
    });

    // 2) Crear condominio (o reutilizar si ya existe)
    const condo = await prisma.condominium.upsert({
        where: { id: 'violetas-condo' },
        update: {},
        create: {
            id: 'violetas-condo',
            name: 'Condominio Las Violetas',
            address: 'Santiago, Chile',
        },
    });

    // 3) Membresía del usuario al condominio (ADMINISTRADOR)
    // Esto vincula al usuario con el condominio específico
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

    console.log('---');
    console.log('✅ Seed finalizado con éxito');
    console.log(`🏠 Condominio ID: ${condo.id}`);
    console.log(`👤 Usuario Admin: ${user.email}`);
    console.log(`🔑 Password: admin123`);
    console.log('---');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });