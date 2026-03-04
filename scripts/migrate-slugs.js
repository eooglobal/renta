const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generatePropertySlug(title, cityName, areaName) {
    if (!title) return '';

    const clean = (text) => {
        return (text || '')
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const slugParts = [
        clean(title),
        clean(cityName),
        clean(areaName)
    ].filter(Boolean);

    let slug = slugParts.join('-');
    const hash = Math.random().toString(36).substring(2, 6);
    return `${slug}-${hash}`;
}

async function migrateSlugs() {
    console.log('Starting slug migration...');
    const properties = await prisma.property.findMany({
        where: { slug: null },
        include: { city: true, area: true }
    });

    console.log(`Found ${properties.length} properties without slugs.`);

    for (const property of properties) {
        const slug = generatePropertySlug(property.title, property.city.name, property.area.name);
        await prisma.property.update({
            where: { id: property.id },
            data: { slug }
        });
        console.log(`Generated slug for [${property.id}]: ${slug}`);
    }

    console.log('Migration complete!');
}

migrateSlugs()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
