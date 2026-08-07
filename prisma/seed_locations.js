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
        { name: 'Tanke', lat: 8.484, lon: 4.595 },
        { name: 'Basin', lat: 8.496, lon: 4.568 },
        { name: 'Malete', lat: 8.718, lon: 4.471 },
        { name: 'Adeta', lat: 8.485, lon: 4.515 },
        { name: 'Challenge', lat: 8.475, lon: 4.545 },
        { name: 'GRA', lat: 8.480, lon: 4.550 },
        { name: 'Fate', lat: 8.482, lon: 4.570 },
        { name: 'Gaa Akanbi', lat: 8.470, lon: 4.575 },
        { name: 'Offa Garage', lat: 8.460, lon: 4.570 },
        { name: 'Taiwo Isale', lat: 8.478, lon: 4.540 },
        { name: 'Taiwo Oke', lat: 8.482, lon: 4.542 },
        { name: 'Tipper Merchant', lat: 8.488, lon: 4.590 },
        { name: 'Sawmill', lat: 8.465, lon: 4.530 },
        { name: 'Ganmo', lat: 8.420, lon: 4.580 },
        { name: 'Kulende', lat: 8.510, lon: 4.560 },
        { name: 'Oja Oba', lat: 8.490, lon: 4.530 },
        { name: 'Asa Dam', lat: 8.460, lon: 4.520 },
        { name: 'Airport Road', lat: 8.440, lon: 4.490 },
        { name: 'Eiyenkorin', lat: 8.420, lon: 4.460 },
        { name: 'Kwara Poly Area', lat: 8.530, lon: 4.580 },
        { name: 'Kilanko', lat: 8.450, lon: 4.580 },
        { name: 'Oke Odo', lat: 8.475, lon: 4.600 },
        { name: 'Agbo Oba', lat: 8.485, lon: 4.535 },
        { name: 'Sango', lat: 8.515, lon: 4.570 },
        { name: 'Zarumi', lat: 8.495, lon: 4.525 },
        { name: 'Adewole', lat: 8.480, lon: 4.510 },
        { name: 'Oke Foma', lat: 8.490, lon: 4.505 },
        { name: 'Mandate', lat: 8.475, lon: 4.500 },
        { name: 'Baboko', lat: 8.488, lon: 4.538 },
        { name: 'Surulere', lat: 8.483, lon: 4.545 },
        { name: 'Olorunsogo', lat: 8.470, lon: 4.525 },
        { name: 'Odota', lat: 8.455, lon: 4.510 },
        { name: 'Irewolede', lat: 8.465, lon: 4.540 },
        { name: 'Oyun', lat: 8.525, lon: 4.575 },
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
