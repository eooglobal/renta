'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, CheckCircle, Phone, Clock, AlertCircle } from 'lucide-react';
import styles from './InspectionModal.module.css';
import { useToast } from '@/components/Toast';
import { friendlyError } from '@/lib/errors';

const TIME_WINDOWS = ['Morning', 'Afternoon', 'Evening'];

export default function InspectionModal({ propertyId, propertyTitle, onClose }) {
    const toast = useToast();
    const [form, setForm] = useState({
        tenantPhone: '',
        preferredDate: '',
        preferredTimeWindow: TIME_WINDOWS[0],
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async () => {
        if (!form.tenantPhone || !form.preferredDate || !form.preferredTimeWindow) {
            setError('Please enter your phone number, preferred date, and time window.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    tenantPhone: form.tenantPhone,
                    preferredDate: form.preferredDate,
                    preferredTimeWindow: form.preferredTimeWindow,
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to request inspection');
            toast.success('Inspection Request Sent', 'Renta staff will contact you to confirm the inspection.');
            setSuccess(true);
        } catch (err) {
            const friendly = friendlyError(err);
            setError(friendly.message);
            toast.error(friendly.title, friendly.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formattedDate = form.preferredDate
        ? new Date(form.preferredDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : '';

    if (success) {
        return (
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.successBox}>
                        <div className={styles.successIcon}>
                            <CheckCircle size={40} />
                        </div>
                        <h2>Request Received</h2>
                        <p className="text-muted mt-2">
                            Renta staff will contact you to confirm your inspection for <strong>{propertyTitle}</strong>.
                        </p>
                        <div className={styles.summaryBox}>
                            <p>
                                <CalendarIcon size={16} className="text-primary" />
                                {formattedDate}
                            </p>
                            <p>
                                <Clock size={16} className="text-primary" />
                                {form.preferredTimeWindow}
                            </p>
                            <p>
                                <Phone size={16} className="text-primary" />
                                {form.tenantPhone}
                            </p>
                        </div>
                        <button className="btn btn-primary mt-8 w-full" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`${styles.modal} fade-in`}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close inspection request modal">
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <h3>Request an Inspection</h3>
                    <p>{propertyTitle}</p>
                </div>

                <div className={styles.content}>
                    {error && (
                        <div className={styles.errorBox}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.requestIntro}>
                        Renta staff will call you to confirm the visit and accompany you for the inspection.
                    </div>

                    <div className={styles.formGrid}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="inspection-phone">Phone Number</label>
                            <input
                                id="inspection-phone"
                                type="tel"
                                className="form-input"
                                value={form.tenantPhone}
                                onChange={(e) => handleChange('tenantPhone', e.target.value)}
                                placeholder="08030000000"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="inspection-date">Preferred Date</label>
                            <input
                                id="inspection-date"
                                type="date"
                                className="form-input"
                                value={form.preferredDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleChange('preferredDate', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="inspection-window">Preferred Time</label>
                            <select
                                id="inspection-window"
                                className="form-input"
                                value={form.preferredTimeWindow}
                                onChange={(e) => handleChange('preferredTimeWindow', e.target.value)}
                            >
                                {TIME_WINDOWS.map((window) => (
                                    <option key={window} value={window}>{window}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary flex-1"
                        disabled={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}