'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Search,
    Copy,
    Check,
    Share2,
    MapPin,
    ExternalLink,
    X,
    Building2,
    Sparkles,
    Loader2,
    DollarSign
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDisplayId } from '@/lib/idFormatter';

export default function AffiliatePropertyListings() {
    const { data: session } = useSession();
    const toast = useToast();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch('/api/properties?status=VERIFIED&limit=24');
                const data = await res.json();
                if (res.ok) {
                    setProperties(data.properties || []);
                }
            } catch (err) {
                console.error('Failed to fetch properties for affiliate promotion:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (!session || session.user.role !== 'AFFILIATE') return null;

    const affiliateCode = `AFF${session.user.id}`;

    const filteredProperties = properties.filter((prop) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        const titleMatch = prop.title?.toLowerCase().includes(query);
        const areaMatch = prop.area?.name?.toLowerCase().includes(query);
        const addressMatch = prop.address?.toLowerCase().includes(query);
        return titleMatch || areaMatch || addressMatch;
    });

    const getAffiliateLink = (propId) => {
        return `${baseUrl}/listing/${propId}?ref=${affiliateCode}`;
    };

    const handleCopy = async (link, propTitle) => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success(
                'Affiliate Link Copied!',
                `Unique share link for "${propTitle}" copied to clipboard.`
            );
            setTimeout(() => setCopied(false), 2200);
        } catch (err) {
            toast.error('Copy Failed', 'Could not copy link to clipboard.');
        }
    };

    const formatMoney = (val) => {
        const num = Number(val) || 0;
        return `₦${num.toLocaleString()}`;
    };

    return (
        <div className="card" style={{ padding: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px'
                }}
            >
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        Promote Verified Listings
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        Select any property to generate your unique tracking link. Earn 2% commission when users register or rent through your link.
                    </p>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                    <input
                        type="text"
                        placeholder="Search area or title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                    />
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }}
                    />
                </div>
            </div>

            {/* Properties Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto' }} />
                    Loading available property listings...
                </div>
            ) : filteredProperties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No verified properties found matching &quot;{search}&quot;.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                        gap: '20px'
                    }}
                >
                    {filteredProperties.map((prop) => {
                        const coverImg = prop.images && prop.images.length > 0 ? prop.images[0] : '/placeholder-property.jpg';
                        const displayId = formatDisplayId('PRP', prop.id);

                        return (
                            <div
                                key={prop.id}
                                className="card"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                            >
                                {/* Image Container */}
                                <div style={{ position: 'relative', height: '160px', width: '100%', background: '#f1f5f9' }}>
                                    <img
                                        src={coverImg}
                                        alt={prop.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'; }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            background: 'rgba(15, 23, 42, 0.75)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#fff',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {displayId}
                                    </span>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <h4
                                        style={{
                                            fontSize: '0.95rem',
                                            fontWeight: '700',
                                            color: 'var(--text-main)',
                                            margin: '0 0 6px 0',
                                            lineHeight: '1.3',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {prop.title}
                                    </h4>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        <MapPin size={14} style={{ color: 'var(--color-primary)', shrink: 0 }} />
                                        <span>{prop.area?.name || 'Ilorin'}, {prop.city?.name || 'Kwara'}</span>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '10px', borderTop: '1px solid var(--border-color)' }}>
                                        <div>
                                            <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                                {formatMoney(prop.rentPrice)}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> /yr</span>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProperty(prop)}
                                            className="btn btn-primary btn-sm"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '6px 12px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Sparkles size={14} /> Promote
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Promote Property Modal */}
            {selectedProperty && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setSelectedProperty(null)}
                >
                    <div
                        className="card fade-in"
                        style={{
                            maxWidth: '520px',
                            width: '100%',
                            padding: '24px',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Affiliate Share Link
                                </span>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                                    Promote Listing
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedProperty(null)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Property Overview Card inside Modal */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '14px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '12px',
                                marginBottom: '20px'
                            }}
                        >
                            <img
                                src={selectedProperty.images && selectedProperty.images.length > 0 ? selectedProperty.images[0] : '/placeholder-property.jpg'}
                                alt={selectedProperty.title}
                                style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'; }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {formatDisplayId('PRP', selectedProperty.id)}
                                </div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedProperty.title}
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                                    <span>{selectedProperty.area?.name || 'Ilorin'}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
                                    {formatMoney(selectedProperty.rentPrice)}/yr
                                </div>
                            </div>
                        </div>

                        {/* Unique Affiliate Link Input Box */}
                        <div style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                Your Custom Affiliate Link
                            </label>
                            <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginTop: '6px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={getAffiliateLink(selectedProperty.id)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        color: 'var(--text-main)',
                                        background: 'transparent',
                                        minWidth: 0
                                    }}
                                />
                                <button
                                    onClick={() => handleCopy(getAffiliateLink(selectedProperty.id), selectedProperty.title)}
                                    className="btn btn-primary"
                                    style={{
                                        borderRadius: 0,
                                        padding: '10px 16px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', margin: '6px 0 0 0' }}>
                                Includes your tracking tag <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>ref={affiliateCode}</code>.
                            </p>
                        </div>

                        {/* Social Share Buttons */}
                        <div style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                                Direct Share Options
                            </label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Check out this property listing on Renta: ${selectedProperty.title} (${formatMoney(selectedProperty.rentPrice)}/yr)\n\n${getAffiliateLink(selectedProperty.id)}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ flex: 1, minWidth: '130px', justifyContent: 'center', gap: '6px', background: '#25D366', color: '#fff', borderColor: '#25D366' }}
                                >
                                    <Share2 size={14} /> WhatsApp
                                </a>

                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this apartment listing in ${selectedProperty.area?.name || 'Ilorin'}: ${selectedProperty.title}`)}&url=${encodeURIComponent(getAffiliateLink(selectedProperty.id))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ flex: 1, minWidth: '130px', justifyContent: 'center', gap: '6px', background: '#000', color: '#fff', borderColor: '#000' }}
                                >
                                    <Share2 size={14} /> X / Twitter
                                </a>
                            </div>
                        </div>

                        {/* View Listing Button */}
                        <div style={{ borderTop: '1px solid var(--border-color)', pt: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <a
                                href={`/listing/${selectedProperty.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <ExternalLink size={14} /> Preview Listing
                            </a>
                            <button
                                onClick={() => setSelectedProperty(null)}
                                className="btn btn-secondary btn-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
