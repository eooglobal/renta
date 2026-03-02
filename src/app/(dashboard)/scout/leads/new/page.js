'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Phone, MapPin, Map, FileText } from 'lucide-react';

export default function NewScoutLeadPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        landlordName: '',
        landlordPhone: '',
        propertyAddress: '',
        propertyArea: 'TANKE',
        notes: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Get location before submitting
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    submitData({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (err) => {
                    console.warn('Geolocation error:', err);
                    // Still submit, but backend will flag it
                    submitData({ latitude: null, longitude: null });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            submitData({ latitude: null, longitude: null });
        }
    };

    const submitData = async (locationData) => {
        try {
            const res = await fetch('/api/scout/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, ...locationData })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Awesome! Lead submitted successfully. You will be notified when it gets verified.');
            router.push('/scout/leads');
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="fade-in max-w-2xl mx-auto">
            <Link href="/scout/leads" className="btn btn-outline" style={{ display: 'inline-flex', marginBottom: 'var(--space-6)', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Back to Leads
            </Link>

            <header className="mb-6">
                <h1 className="text-2xl font-bold">Submit a New Lead</h1>
                <p className="text-muted">Enter the details of the unlisted property you found. Our team will verify it.</p>
            </header>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="card p-6">
                <div className="space-y-4">
                    <div>
                        <label className="form-label flex items-center gap-2"><UserPlus size={16} /> Landlord's Full Name</label>
                        <input
                            type="text"
                            name="landlordName"
                            value={formData.landlordName}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="e.g. Alh. Olatunde Bello"
                        />
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2"><Phone size={16} /> Landlord's Phone Number</label>
                        <input
                            type="tel"
                            name="landlordPhone"
                            value={formData.landlordPhone}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="e.g. 08012345678"
                        />
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2"><MapPin size={16} /> Property Exact Address</label>
                        <textarea
                            name="propertyAddress"
                            value={formData.propertyAddress}
                            onChange={handleChange}
                            required
                            rows="2"
                            className="form-input"
                            placeholder="e.g. 15 University Road, beside Zenith Bank"
                        />
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2"><Map size={16} /> General Area</label>
                        <select
                            name="propertyArea"
                            value={formData.propertyArea}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option value="TANKE">Tanke</option>
                            <option value="BASIN">Basin</option>
                            <option value="MALETE">Malete</option>
                            <option value="OTHER">Other Region</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2"><FileText size={16} /> Additional Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="form-input"
                            placeholder="Any context to help the verification team? E.g. 'He prefers calls in the evening.'"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary w-full mt-4"
                    >
                        {submitting ? 'Submitting...' : 'Submit Lead'}
                    </button>
                    <p className="text-xs text-muted text-center mt-3">
                        By submitting, you agree to the Scout terms. Falsifying leads can result in suspension.
                    </p>
                </div>
            </form>
        </div>
    );
}