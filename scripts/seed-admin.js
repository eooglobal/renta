const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        // 1. Revert landlord account
        console.log('Reverting maxemmily+landlord@gmail.com to LANDLORD...');
        await prisma.user.update({
            where: { email: 'maxemmily+landlord@gmail.com' },
            data: { role: 'LANDLORD', adminRole: null }
        });
        console.log('  ✓ Reverted to LANDLORD');

        // 2. Create dedicated super admin
        console.log('Creating dedicated super admin...');
        const passwordHash = await bcrypt.hash('BiGeMMy.50796', 12);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@renta.com' },
            update: {
                passwordHash,
                role: 'ADMIN',
                adminRole: 'SUPER_ADMIN',
                firstName: 'Renta',
                lastName: 'Admin',
                ninStatus: 'VERIFIED',
                status: 'ACTIVE'
            },
            create: {
                email: 'admin@renta.com',
                passwordHash,
                role: 'ADMIN',
                adminRole: 'SUPER_ADMIN',
                firstName: 'Renta',
                lastName: 'Admin',
                ninStatus: 'VERIFIED',
                status: 'ACTIVE'
            }
        });
        console.log(`  ✓ Super Admin created: ${admin.email} (ID: ${admin.id})`);
        console.log('\n  Login: admin@renta.com / BiGeMMy.50796');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
