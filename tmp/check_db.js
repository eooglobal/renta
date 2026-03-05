const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cities = await prisma.city.findMany({
        include: { areas: true }
    });
    console.log('Cities in DB:', JSON.stringify(cities, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
