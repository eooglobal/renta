'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Briefcase, DollarSign, Building, UserCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { friendlyError } from '@/lib/errors';

export default function TenantScreeningPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        employmentStatus: 'EMPLOYED',
        monthlyIncome: '',
        employerName: '',
        previousLandlordReference: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/tenant/profile');
                const data = await res.json();
                if (res.ok && data.id) {
                    setForm({
                        employmentStatus: data.employmentStatus || 'EMPLOYED',
                        monthlyIncome: data.monthlyIncome ? String(data.monthlyIncome) : '',
                        employerName: data.employerName || '',
                        previousLandlordReference: data.previousLandlordReference || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/tenant/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employmentStatus: form.employmentStatus,
                    monthlyIncome: Number(form.monthlyIncome),
                    employerName: form.employerName,
                    previousLandlordReference: form.previousLandlordReference
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Screening Saved', 'Your screening profile has been successfully saved!');

            // Redirect back to search or previous page
            const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/tenant/search';
            router.push(returnUrl);
        } catch (err) {
            const friendly = friendlyError(err);
            toast.error(friendly.title, friendly.message);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center" style={{ padding: '100px 0' }}>
                <Loader2 size={32} className="text-primary-color" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card shadow-md">
                <div className="card-header border-b pb-4 mb-6 flex flex-col items-center text-center">
                    <div className="p-3 rounded-full mb-3" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tenant Screening Profile</h2>
                    <p className="text-muted text-sm">Landlords on Renta use this information to review your rental requests.
                        Completing this profile improves your chances of securing an apartment.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label className="form-label flex items-center gap-2">
                            <Briefcase size={16} className="text-muted" /> Employment Status
                        </label>
                        <select
                            className="form-input"
                            value={form.employmentStatus}
                            onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                            required
                        >
                            <option value="EMPLOYED">Employed</option>
                            <option value="SELF_EMPLOYED">Self-Employed / Business Owner</option>
                            <option value="STUDENT">Student</option>
                            <option value="UNEMPLOYED">Unemployed</option>
                            <option value="RETIRED">Retired</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center gap-2">
                            <DollarSign size={16} className="text-muted" /> Monthly Income (₦)
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={form.monthlyIncome}
                            onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                            placeholder="e.g. 250000"
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center gap-2">
                            <Building size={16} className="text-muted" /> Employer Name / School (Optional)
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.employerName}
                            onChange={(e) => setForm({ ...form, employerName: e.target.value })}
                            placeholder="Where do you work or study?"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center gap-2">
                            <UserCheck size={16} className="text-muted" /> Previous Landlord Reference (Optional)
                        </label>
                        <textarea
                            className="form-input"
                            value={form.previousLandlordReference}
                            onChange={(e) => setForm({ ...form, previousLandlordReference: e.target.value })}
                            placeholder="Name, Phone Number, or any reference notes from a previous landlord."
                            rows="3"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg mt-6"
                        disabled={saving}
                    >
                        {saving ? (
                            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                        ) : (
                            'Save & Complete Profile'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
