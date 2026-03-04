const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteUser() {
    const email = 'maxemmily+landlord@gmail.com';
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: {
                role: 'ADMIN',
                adminRole: 'SUPER_ADMIN'
            }
        });
        console.log(`Successfully promoted ${user.email} (ID: ${user.id}) to ADMIN with SUPER_ADMIN privileges.`);
    } catch (e) {
        console.error(`Error promoting user: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

promoteUser();
