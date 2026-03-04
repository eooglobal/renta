'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './InspectionModal.module.css';

export default function InspectionModal({ propertyId, propertyTitle, onClose }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const res = await fetch(`/api/inspections?propertyId=${propertyId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to fetch slots');

                // Only show AVAILABLE slots
                const availableSlots = data.filter(s => s.status === 'AVAILABLE');
                setSlots(availableSlots);

                // Group by date to find unique dates
                const uniqueDates = [...new Set(availableSlots.map(s => s.date.split('T')[0]))];
                if (uniqueDates.length > 0) {
                    setSelectedDate(uniqueDates[0]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) fetchSlots();
    }, [propertyId]);

    const handleBook = async () => {
        if (!selectedSlotId) return;

        try {
            setBooking(true);
            setError('');
            const res = await fetch('/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId: selectedSlotId })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setBooking(false);
        }
    };

    // Helper functions for dates
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
    };

    const uniqueDates = [...new Set(slots.map(s => s.date.split('T')[0]))].sort();
    const currentSlots = slots.filter(s => s.date.split('T')[0] === selectedDate);

    if (success) {
        return (
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.successBox}>
                        <div className={styles.successIcon}>
                            <CheckCircle size={40} />
                        </div>
                        <h2>Booking Confirmed!</h2>
                        <p className="text-muted mt-2">
                            Your inspection for <strong>{propertyTitle}</strong> has been scheduled.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mt-6 text-sm border">
                            <p className="flex items-center justify-center gap-2 mb-1">
                                <CalendarIcon size={16} className="text-primary" />
                                {formatDate(selectedDate).full}
                            </p>
                            <p className="flex items-center justify-center gap-2">
                                <Clock size={16} className="text-primary" />
                                {slots.find(s => s.id === selectedSlotId)?.startTime} - {slots.find(s => s.id === selectedSlotId)?.endTime}
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
            <div className={styles.modal} className="fade-in">
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <h3>Book an Inspection</h3>
                    <p>{propertyTitle}</p>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className="flex justify-center p-8"><span className="spinner"></span></div>
                    ) : error ? (
                        <div className={styles.errorBox}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="text-center p-8">
                            <CalendarIcon size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500">No inspection slots available at the moment. Please contact the landlord.</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.sectionTitle}>Select Date</div>
                            <div className={styles.dateGrid}>
                                {uniqueDates.map(date => {
                                    const info = formatDate(date);
                                    return (
                                        <div
                                            key={date}
                                            className={`${styles.dateCard} ${selectedDate === date ? styles.active : ''}`}
                                            onClick={() => {
                                                setSelectedDate(date);
                                                setSelectedSlotId(null);
                                            }}
                                        >
                                            <span className={styles.day}>{info.day}</span>
                                            <span className={styles.date}>{info.date}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.sectionTitle}>Available Times ({formatDate(selectedDate).full})</div>
                            <div className={styles.timeGrid}>
                                {currentSlots.map(slot => (
                                    <div
                                        key={slot.id}
                                        className={`${styles.timeSlot} ${selectedSlotId === slot.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedSlotId(slot.id)}
                                    >
                                        {slot.startTime} - {slot.endTime}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary flex-1"
                        disabled={!selectedSlotId || booking || loading}
                        onClick={handleBook}
                    >
                        {booking ? 'Booking...' : 'Confirm Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}
