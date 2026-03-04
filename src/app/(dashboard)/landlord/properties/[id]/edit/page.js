'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';

const PROPERTY_TYPES = [
    { value: 'SELF_CON', label: 'Self Contained' },
    { value: 'SINGLE_ROOM', label: 'Single Room' },
    { value: 'FLAT', label: 'Flat' },
    { value: 'TWO_BEDROOM', label: '2 Bedroom' },
    { value: 'THREE_BEDROOM', label: '3 Bedroom' },
];

// Areas will be fetched dynamically from the /api/locations/cities endpoint

const AMENITIES_OPTIONS = [
    'Water', 'Electricity', 'Security', 'Parking', 'Tiled Floor',
    'POP Ceiling', 'Wardrobe', 'Kitchen', 'Bathroom', 'Toilet',
    'Fence', 'Gate', 'Borehole', 'Generator', 'WiFi Ready',
];

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [property, setProperty] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        rentPrice: '',
        type: '',
        address: '',
        cityId: '',
        areaId: '',
        amenities: [],
        studentFriendly: false,
    });
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations/cities');
                if (res.ok) {
                    const data = await res.json();
                    setCities(data);
                }
            } catch (err) {
                console.error('Failed to fetch cities', err);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await fetch(`/api/properties/${propertyId}`);
                const data = await res.json();

                if (!res.ok) {
                    setMessage({ type: 'error', text: data.error || 'Failed to load property' });
                    setLoading(false);
                    return;
                }

                const p = data.property;
                setProperty(p);
                setForm({
                    title: p.title || '',
                    description: p.description || '',
                    rentPrice: Number(p.rentPrice) || '',
                    type: p.type || '',
                    address: p.address || '',
                    cityId: p.cityId?.toString() || '',
                    areaId: p.areaId?.toString() || '',
                    amenities: p.amenities || [],
                    studentFriendly: p.studentFriendly || false,
                });
            } catch {
                setMessage({ type: 'error', text: 'Something went wrong loading the property.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [propertyId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        setMessage({ type: '', text: '' });
    };

    const toggleAmenity = (amenity) => {
        setForm({
            ...form,
            amenities: form.amenities.includes(amenity)
                ? form.amenities.filter(a => a !== amenity)
                : [...form.amenities, amenity],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/properties/${propertyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    rentPrice: parseFloat(form.rentPrice),
                    cityId: parseInt(form.cityId),
                    areaId: parseInt(form.areaId),
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            } else {
                setMessage({ type: 'success', text: 'Property updated successfully!' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Something went wrong.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Delete failed');
            } else {
                router.push('/landlord/properties');
            }
        } catch {
            alert('Something went wrong.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Loader2 size={32} style={{ color: 'var(--color-primary)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                    <p className="text-muted mt-4">Loading property details...</p>
                </div>
            </div>
        );
    }

    const serviceFee = form.rentPrice ? (parseFloat(form.rentPrice) * 0.1).toLocaleString() : '0';
    const totalPayable = form.rentPrice ? (parseFloat(form.rentPrice) * 1.1).toLocaleString() : '0';

    return (
        <div className="fade-in">
            <header className="mb-6 flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                    <button onClick={() => router.push('/landlord/properties')} className="btn btn-ghost btn-sm mb-2">
                        <ArrowLeft size={16} /> Back to Properties
                    </button>
                    <h1 style={{ fontSize: 'var(--text-2xl)' }}>Edit Property</h1>
                    <p className="text-muted">Update your listing details below.</p>
                </div>
                {property && (
                    <span className={`badge ${property.status === 'VERIFIED' ? 'badge-verified' : property.status === 'RENTED' ? 'badge-info' : 'badge-pending'}`}>
                        {property.status}
                    </span>
                )}
            </header>

            {/* Images Preview */}
            {property?.images?.length > 0 && (
                <div className="card mb-6">
                    <h3 className="mb-4" style={{ fontSize: 'var(--text-lg)' }}>Current Photos</h3>
                    <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
                        {property.images.map(img => (
                            <div key={img.id} style={{
                                width: '120px', height: '90px', borderRadius: 'var(--radius-md)',
                                overflow: 'hidden', flexShrink: 0, position: 'relative',
                                border: img.isPrimary ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                            }}>
                                <img src={img.url} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {img.isPrimary && (
                                    <span style={{
                                        position: 'absolute', top: '4px', left: '4px',
                                        background: 'var(--color-primary)', color: 'var(--color-black)',
                                        fontSize: '9px', fontWeight: 'bold', borderRadius: '4px',
                                        padding: '1px 5px',
                                    }}>Cover</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Message */}
            {message.text && (
                <div className="card mb-4 flex items-center gap-3" style={{
                    background: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    borderLeft: `4px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                }}>
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Property Details */}
                <div className="card mb-6">
                    <h3 className="mb-4" style={{ fontSize: 'var(--text-lg)' }}>Property Details</h3>

                    <div className="form-group">
                        <label className="form-label">Property Title</label>
                        <input type="text" name="title" className="form-input"
                            value={form.title} onChange={handleChange} required />
                    </div>

                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <select name="cityId" className="form-input"
                                value={form.cityId}
                                onChange={e => setForm({ ...form, cityId: e.target.value, areaId: '' })}
                                required>
                                <option value="">Select city</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Area / Neighborhood</label>
                            <select name="areaId" className="form-input"
                                value={form.areaId}
                                disabled={!form.cityId}
                                onChange={handleChange}
                                required>
                                <option value="">Select area</option>
                                {form.cityId && cities.find(c => c.id === parseInt(form.cityId))?.areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Property Type</label>
                        <select name="type" className="form-input" value={form.type} onChange={handleChange} required>
                            <option value="">Select type</option>
                            {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Full Address</label>
                        <input type="text" name="address" className="form-input"
                            value={form.address} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Annual Rent (₦)</label>
                        <input type="number" name="rentPrice" className="form-input"
                            value={form.rentPrice} onChange={handleChange} required min="1" />
                        {form.rentPrice && (
                            <span className="form-help">
                                Tenant pays: ₦{totalPayable} (₦{Number(form.rentPrice).toLocaleString()} + ₦{serviceFee} service fee)
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-input"
                            value={form.description} onChange={handleChange} required rows={4} />
                    </div>
                </div>

                {/* Amenities */}
                <div className="card mb-6">
                    <h3 className="mb-4" style={{ fontSize: 'var(--text-lg)' }}>Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                        {AMENITIES_OPTIONS.map(amenity => (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className={`btn btn-sm ${form.amenities.includes(amenity) ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {amenity}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 mt-4" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" name="studentFriendly"
                            checked={form.studentFriendly} onChange={handleChange} />
                        <span className="text-sm">Student-Friendly Property</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ minWidth: '200px' }}>
                        {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={18} /> Save Changes</>}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting...' : <><Trash2 size={16} /> Delete Property</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
