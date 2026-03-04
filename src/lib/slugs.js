/**
 * Generates a URL-friendly slug for a property listing.
 * Format: {property-title}-{city}-{area}-{id-short-hash}
 * 
 * @param {string} title The property title
 * @param {string} cityName The city name
 * @param {string} areaName The area/neighborhood name
 * @returns {string} A slugified string
 */
export function generatePropertySlug(title, cityName, areaName) {
    if (!title) return '';

    // Convert to lowercase and remove non-alphanumeric characters
    const clean = (text) => {
        return (text || '')
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // remove special chars
            .replace(/[\s_]+/g, '-')  // replace spaces/underscores with dashes
            .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
    };

    const slugParts = [
        clean(title),
        clean(cityName),
        clean(areaName)
    ].filter(Boolean);

    let slug = slugParts.join('-');

    // Append a small random hash to ensure uniqueness if titles are similar
    const hash = Math.random().toString(36).substring(2, 6);
    return `${slug}-${hash}`;
}
