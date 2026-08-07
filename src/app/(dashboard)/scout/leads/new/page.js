'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Phone, MapPin, Map, FileText, PlusCircle, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function NewScoutLeadPage() {
    const router = useRouter();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [areas, setAreas] = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(true);

    const [formData, setFormData] = useState({
        landlordName: '',
        landlordPhone: '',
        propertyAddress: '',
        propertyArea: '',
        customAreaName: '',
        notes: ''
    });

    useEffect(() => {
        async function fetchAreas() {
            try {
                const res = await fetch('/api/locations/cities');
                if (res.ok) {
                    const cities = await res.json();
                    const ilorinCity = cities.find(c => c.name.toLowerCase().includes('ilorin')) || cities[0];
                    if (ilorinCity && ilorinCity.areas) {
                        setAreas(ilorinCity.areas);
                        if (ilorinCity.areas.length > 0) {
                            setFormData(prev => ({ ...prev, propertyArea: ilorinCity.areas[0].name }));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load areas:', err);
            } finally {
                setLoadingAreas(false);
            }
        }
        fetchAreas();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const targetAreaName = formData.propertyArea === 'OTHER' 
            ? formData.customAreaName.trim() 
            : formData.propertyArea;

        if (!targetAreaName) {
            setError('Please select or specify the general area for this property.');
            setSubmitting(false);
            return;
        }

        // Get location before submitting
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    submitData({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        targetAreaName
                    });
                },
                (err) => {
                    console.warn('Geolocation error:', err);
                    submitData({ latitude: null, longitude: null, targetAreaName });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            submitData({ latitude: null, longitude: null, targetAreaName });
        }
    };

    const submitData = async ({ latitude, longitude, targetAreaName }) => {
        try {
            const payload = {
                landlordName: formData.landlordName,
                landlordPhone: formData.landlordPhone,
                propertyAddress: formData.propertyAddress,
                propertyArea: targetAreaName,
                notes: formData.notes,
                latitude,
                longitude
            };

            const res = await fetch('/api/scout/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Lead Submitted!', 'Awesome! Lead submitted successfully. You will be notified when it gets verified.');
            router.push('/scout/leads');
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
            
            {/* Top Navigation & Header */}
            <div style={{ marginBottom: '20px' }}>
                <Link 
                    href="/scout/leads" 
                    className="btn btn-outline btn-sm" 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                        padding: '6px 12px'
                    }}
                >
                    <ArrowLeft size={14} /> Back to Leads
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--color-primary), #0284C7)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                    }}>
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                            Submit a New Lead
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            Submit unlisted properties to earn commission upon verification.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#FEF2F2',
                    color: '#DC2626',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #FCA5A5',
                    fontSize: '0.875rem',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {/* Main Form Container */}
            <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* SECTION 1: Landlord Information */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <UserPlus size={16} style={{ color: 'var(--color-primary)' }} />
                            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                                Landlord Information
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="landlordName"
                                    value={formData.landlordName}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="e.g. Alh. Olatunde Bello"
                                    style={{ fontSize: '0.9rem', padding: '10px 14px' }}
                                />
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                                    Phone Number <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="landlordPhone"
                                    value={formData.landlordPhone}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="e.g. 08012345678"
                                    style={{ fontSize: '0.9rem', padding: '10px 14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Property Location & Details */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                                Property Location & Area
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                                    Exact Address <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <textarea
                                    name="propertyAddress"
                                    value={formData.propertyAddress}
                                    onChange={handleChange}
                                    required
                                    rows="2"
                                    className="form-input"
                                    placeholder="e.g. 15 University Road, beside Zenith Bank"
                                    style={{ fontSize: '0.9rem', padding: '10px 14px', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                                    General Area / Neighborhood <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <select
                                    name="propertyArea"
                                    value={formData.propertyArea}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ fontSize: '0.9rem', padding: '10px 14px', height: '42px' }}
                                >
                                    {areas.map(a => (
                                        <option key={a.id || a.name} value={a.name}>{a.name}</option>
                                    ))}
                                    <option value="OTHER">+ Add New / Custom Area</option>
                                </select>
                            </div>

                            {formData.propertyArea === 'OTHER' && (
                                <div className="fade-in" style={{
                                    padding: '14px',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid #BAE6FD',
                                    background: '#F0F9FF'
                                }}>
                                    <label className="form-label" style={{ fontSize: '0.85rem', color: '#0369A1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <PlusCircle size={14} style={{ color: '#0284C7' }} /> Specify New Area Name
                                    </label>
                                    <input
                                        type="text"
                                        name="customAreaName"
                                        value={formData.customAreaName}
                                        onChange={handleChange}
                                        required={formData.propertyArea === 'OTHER'}
                                        className="form-input"
                                        placeholder="e.g. Tanke Budo Nuhu, Kilanko, Pipeline..."
                                        style={{ fontSize: '0.9rem', padding: '10px 14px', background: '#fff' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#0284C7', margin: '6px 0 0 0' }}>
                                        This area will be saved in the database and made available platform-wide!
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="2"
                                    className="form-input"
                                    placeholder="e.g. 'He prefers calls in the evening', '2-bedroom flat under construction'"
                                    style={{ fontSize: '0.9rem', padding: '10px 14px', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button & Disclaimer */}
                    <div style={{ paddingTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                borderRadius: 'var(--radius-lg)'
                            }}
                        >
                            {submitting ? (
                                <>
                                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                                    Submitting Lead...
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> Submit Lead for Verification
                                </>
                            )}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
                            <span>By submitting, you confirm the details are accurate. Falsifying leads can result in account review.</span>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}