import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {
            name: 'Admin Test',
            role: Role.ADMIN,
            active: true,
            passwordHash,
        },
        create: {
            name: 'Admin Test',
            email: 'admin@test.com',
            passwordHash,
            role: Role.ADMIN,
            active: true,
        },
    });

    console.log('✅ Seed OK: admin@test.com / Admin123!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
