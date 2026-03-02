'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, GraduationCap, MapPin, Home, CheckCircle } from 'lucide-react';
import styles from './search.module.css';
import dashStyles from '../dashboard.module.css';

const AREAS = [
    { value: '', label: 'All Areas' },
    { value: 'TANKE', label: 'Tanke' },
    { value: 'BASIN', label: 'Basin' },
    { value: 'MALETE', label: 'Malete' },
];

const PROPERTY_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'SELF_CON', label: 'Self Contained' },
    { value: 'SINGLE_ROOM', label: 'Single Room' },
    { value: 'FLAT', label: 'Flat' },
    { value: 'TWO_BEDROOM', label: '2 Bedroom' },
    { value: 'THREE_BEDROOM', label: '3 Bedroom' },
];

const PRICE_RANGES = [
    { value: '', label: 'Any Price' },
    { value: '0-100000', label: 'Under ₦100K' },
    { value: '100000-200000', label: '₦100K - ₦200K' },
    { value: '200000-350000', label: '₦200K - ₦350K' },
    { value: '350000-500000', label: '₦350K - ₦500K' },
    { value: '500000-9999999', label: 'Above ₦500K' },
];

export default function TenantSearchPage() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        area: '', type: '', priceRange: '',
        studentFriendly: false, search: '',
    });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        fetchProperties();
    }, [filters.area, filters.type, filters.priceRange, filters.studentFriendly]);

    const fetchProperties = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', '12');
            if (filters.area) params.set('area', filters.area);
            if (filters.type) params.set('type', filters.type);
            if (filters.studentFriendly) params.set('studentFriendly', 'true');
            if (filters.search) params.set('search', filters.search);
            if (filters.priceRange) {
                const [min, max] = filters.priceRange.split('-');
                params.set('minPrice', min);
                params.set('maxPrice', max);
            }

            const res = await fetch(`/api/properties?${params}`);
            const data = await res.json();
            setProperties(data.properties || []);
            setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProperties();
    };

    const formatType = (type) => {
        const map = {
            SELF_CON: 'Self Con', SINGLE_ROOM: 'Room', FLAT: 'Flat',
            TWO_BEDROOM: '2 Bed', THREE_BEDROOM: '3 Bed',
        };
        return map[type] || type;
    };

    return (
        <div className="fade-in">
            <div className={dashStyles.welcomeSection}>
                <h2>Find Your Apartment</h2>
                <p className="text-muted">Browse verified apartments in Ilorin</p>
            </div>

            {/* Search & Filters */}
            <div className={`card ${styles.filtersCard}`}>
                <form onSubmit={handleSearch} className={styles.searchBar}>
                    <input
                        type="text" className="form-input" placeholder="Search by title, address..."
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary">Search</button>
                </form>

                <div className={styles.filterRow}>
                    <select className="form-input" value={filters.area}
                        onChange={e => setFilters({ ...filters, area: e.target.value })}>
                        {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <select className="form-input" value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}>
                        {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select className="form-input" value={filters.priceRange}
                        onChange={e => setFilters({ ...filters, priceRange: e.target.value })}>
                        {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <label className={styles.sfToggle}>
                        <input type="checkbox" checked={filters.studentFriendly}
                            onChange={e => setFilters({ ...filters, studentFriendly: e.target.checked })} />
                        <span className="flex items-center gap-1"><GraduationCap size={16} /> Student Friendly</span>
                    </label>
                </div>
            </div>

            {/* Results count */}
            <p className="text-muted text-sm mb-4">
                {pagination.total} {pagination.total === 1 ? 'property' : 'properties'} found
            </p>

            {/* Results */}
            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : properties.length === 0 ? (
                <div className={dashStyles.emptyState}>
                    <div className={dashStyles.emptyIcon}><Search size={48} /></div>
                    <h3>No properties found</h3>
                    <p>Try adjusting your filters or search for a different area.</p>
                </div>
            ) : (
                <>
                    <div className={dashStyles.propertyGrid}>
                        {properties.map(property => (
                            <Link key={property.id} href={`/tenant/listing/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className={`${dashStyles.propertyCard} card-interactive`}>
                                    <div className={dashStyles.propertyImage}>
                                        {property.images?.[0] ? (
                                            <img src={property.images[0].url} alt={property.title} />
                                        ) : (
                                            <span>No Image</span>
                                        )}
                                        <div className={dashStyles.propertyBadge}>
                                            {property.verificationStatus === 'VERIFIED' && (
                                                <span className="badge badge-verified"><CheckCircle size={14} /> Verified</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={dashStyles.propertyInfo}>
                                        <h4>{property.title}</h4>
                                        <div className={dashStyles.propertyMeta}>
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {property.area}</span>
                                            <span className="flex items-center gap-1"><Home size={14} /> {formatType(property.type)}</span>
                                            {property.studentFriendly && <span title="Student Friendly"><GraduationCap size={14} /></span>}
                                        </div>
                                        <div className={dashStyles.propertyPrice}>
                                            ₦{Number(property.rentPrice).toLocaleString()}
                                            <span> /year</span>
                                        </div>
                                        <p className="text-xs text-muted mt-1">
                                            Total: ₦{(Number(property.rentPrice) * 1.1).toLocaleString()} inc. 10% fee
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className="btn btn-outline btn-sm"
                                disabled={pagination.page <= 1}
                                onClick={() => fetchProperties(pagination.page - 1)}>
                                Previous
                            </button>
                            <span className="text-sm text-muted">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button className="btn btn-outline btn-sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchProperties(pagination.page + 1)}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
