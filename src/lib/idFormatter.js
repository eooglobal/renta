/**
 * Generates formatted human-friendly display IDs (e.g. SLD-0014, PRP-0025, RNT-0008, USR-0005, TXN-0012)
 * while preserving existing database primary key integers and foreign key relationships.
 * 
 * @param {string} prefix - Type prefix (e.g. 'SLD', 'PRP', 'RNT', 'USR', 'CMS', 'TXN', 'WD')
 * @param {number|string} id - Database integer ID
 * @returns {string} Formatted display ID
 */
export function formatDisplayId(prefix, id) {
    if (!id) return '';
    const cleanPrefix = String(prefix).toUpperCase().substring(0, 3);
    const numStr = String(id).padStart(4, '0');
    return `${cleanPrefix}-${numStr}`;
}
