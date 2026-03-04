const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        const columns = await prisma.$queryRawUnsafe(`DESCRIBE properties`);
        console.log('Columns in properties table:');
        console.table(columns);
        const hasSlug = columns.some(c => c.Field === 'slug');
        console.log('Has slug column:', hasSlug);
    } catch (e) {
        console.error('Failed to describe table:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
