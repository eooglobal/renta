const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING CITIES AND AREAS ---');

    // 1. Create Ilorin City
    const ilorin = await prisma.city.upsert({
        where: { name: 'Ilorin' },
        update: {},
        create: {
            name: 'Ilorin',
            state: 'Kwara',
            latitude: 8.4799,
            longitude: 4.5418,
        },
    });
    console.log(`City created: ${ilorin.name}`);

    // 2. Create Lagos City (for expansion testing)
    const lagos = await prisma.city.upsert({
        where: { name: 'Lagos' },
        update: {},
        create: {
            name: 'Lagos',
            state: 'Lagos',
            latitude: 6.5244,
            longitude: 3.3792,
        },
    });
    console.log(`City created: ${lagos.name}`);

    // 3. Create Areas for Ilorin
    const ilorinAreas = [
        { name: 'TANKE', lat: 8.484, lon: 4.595 },
        { name: 'BASIN', lat: 8.496, lon: 4.568 },
        { name: 'MALETE', lat: 8.718, lon: 4.471 },
        { name: 'ADETA', lat: 8.485, lon: 4.515 },
        { name: 'CHALLENGE', lat: 8.475, lon: 4.545 },
    ];

    for (const area of ilorinAreas) {
        await prisma.area.upsert({
            where: { name_cityId: { name: area.name, cityId: ilorin.id } },
            update: {},
            create: {
                name: area.name,
                cityId: ilorin.id,
                latitude: area.lat,
                longitude: area.lon,
            },
        });
    }
    console.log(`Areas created for ${ilorin.name}`);

    // 4. Create Areas for Lagos
    const lagosAreas = [
        { name: 'LEKKI', lat: 6.459, lon: 3.601 },
        { name: 'IKEJA', lat: 6.6018, lon: 3.3515 },
        { name: 'VICTORIA ISLAND', lat: 6.428, lon: 3.421 },
    ];

    for (const area of lagosAreas) {
        await prisma.area.upsert({
            where: { name_cityId: { name: area.name, cityId: lagos.id } },
            update: {},
            create: {
                name: area.name,
                cityId: lagos.id,
                latitude: area.lat,
                longitude: area.lon,
            },
        });
    }
    console.log(`Areas created for ${lagos.name}`);

    console.log('--- SEEDING COMPLETE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
