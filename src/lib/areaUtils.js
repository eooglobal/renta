import { prisma } from './db';

/**
 * Finds an existing Area by name (case-insensitive) or automatically creates a new Area in the database.
 * Newly created areas immediately populate the location list for all future users across Renta!
 * 
 * @param {string} rawAreaName - The area name entered or selected by the user.
 * @param {number|string} [customCityId] - Optional explicit city ID.
 * @returns {Promise<Object>} The Prisma Area object.
 */
export async function findOrCreateArea(rawAreaName, customCityId = null) {
    if (!rawAreaName || !String(rawAreaName).trim()) {
        throw new Error('Area name cannot be empty');
    }

    const cleanName = String(rawAreaName).trim();

    // 1. Get default city (Ilorin, Kwara) if customCityId is not provided
    let cityId = customCityId ? parseInt(customCityId) : null;
    if (!cityId) {
        let city = await prisma.city.findFirst({
            where: { name: { contains: 'Ilorin' } }
        });
        if (!city) {
            city = await prisma.city.findFirst();
        }
        if (!city) {
            city = await prisma.city.create({
                data: {
                    name: 'Ilorin',
                    state: 'Kwara',
                    latitude: 8.4799,
                    longitude: 4.5418
                }
            });
        }
        cityId = city.id;
    }

    // 2. Search for existing area in this city (exact match first)
    const exactArea = await prisma.area.findFirst({
        where: {
            cityId: cityId,
            name: cleanName
        }
    });

    if (exactArea) {
        return exactArea;
    }

    // 3. Search case-insensitive match
    const existingAreas = await prisma.area.findMany({
        where: { cityId: cityId }
    });

    const match = existingAreas.find(
        a => a.name.toLowerCase().trim() === cleanName.toLowerCase()
    );

    if (match) {
        return match;
    }

    // 4. Format area name nicely (e.g. "tanke oke odo" -> "Tanke Oke Odo")
    const formattedName = cleanName
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    // 5. Create new Area row in database
    const newArea = await prisma.area.create({
        data: {
            name: formattedName,
            cityId: cityId
        }
    });

    console.log(`[DYNAMIC AREA CREATED] Saved new area "${newArea.name}" (ID: ${newArea.id}) to city ID ${cityId}`);
    return newArea;
}
