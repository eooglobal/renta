'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, Home, MapPin, Calendar, Shield, CheckCircle, Clock, AlertTriangle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';

const statusConfig = {
    PENDING: { label: 'Pending', badge: 'badge-pending', icon: Clock },
    ACTIVE: { label: 'Active', badge: 'badge-verified', icon: CheckCircle },
    COMPLETED: { label: 'Completed', badge: 'badge-info', icon: CheckCircle },
    DISPUTED: { label: 'Disputed', badge: 'badge-error', icon: AlertTriangle },
    CANCELLED: { label: 'Cancelled', badge: 'badge-error', icon: AlertTriangle },
};

const escrowLabels = {
    PENDING: 'Escrow Pending',
    HELD: 'Escrow Held',
    RELEASED: 'Escrow Released',
    DISPUTED: 'Escrow Disputed',
    REFUNDED: 'Escrow Refunded',
};

export default function TenantRentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [signingRental, setSigningRental] = useState(null);

    const fetchRentals = async () => {
        try {
            const res = await fetch('/api/tenant/rentals');
            const data = await res.json();
            if (res.ok) setRentals(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    const handleSign = async (signature) => {
        if (!signingRental) return;
        
        try {
            const res = await fetch(`/api/rentals/${signingRental.id}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature, role: 'TENANT' })
            });

            if (res.ok) {
                alert('Agreement signed successfully!');
                setSigningRental(null);
                fetchRentals();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to sign agreement');
            }
        } catch (err) {
            alert('Something went wrong');
        }
    };

    const handleDispute = async (escrowId) => {
        const reason = window.prompt("Please detail the reason for the dispute. This will halt escrow release until an Admin reviews it.");

        if (!reason) return; // User cancelled
        if (reason.length < 10) {
            alert("Please provide a more detailed reason for the dispute (at least 10 characters).");
            return;
        }

        try {
            const res = await fetch(`/api/escrow/${escrowId}/dispute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                // Re-fetch to update status flags
                const fetchRes = await fetch('/api/tenant/rentals');
                const newData = await fetchRes.json();
                if (fetchRes.ok) setRentals(newData);
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error("Dispute failed", err);
            alert("Failed to submit dispute.");
        }
    };

    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>My Rentals</h1>
                <p className="text-muted">Track all your rental agreements and payment status.</p>
            </header>

            {loading ? (
                <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading your rentals...</div>
            ) : rentals.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Home size={48} style={{ color: 'var(--text-light)', margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>No rentals yet</h3>
                    <p className="text-muted text-sm mt-2">Browse apartments and make a payment to start your first rental.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {rentals.map(rental => {
                        const status = statusConfig[rental.status] || statusConfig.PENDING;
                        const StatusIcon = status.icon;
                        const image = rental.property?.images?.[0]?.url;

                        return (
                            <div key={rental.id} className="card">
                                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                                    {/* Property Image */}
                                    {image && (
                                        <div style={{
                                            position: 'relative', width: '120px', height: '90px', borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)'
                                        }}>
                                            <Image
                                                src={image}
                                                alt={rental.property?.title || 'Property Image'}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="120px"
                                            />
                                        </div>
                                    )}

                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                <StatusIcon size={12} /> {status.label}
                                            </span>
                                            {rental.escrow && (
                                                <span className="badge badge-primary flex items-center gap-1">
                                                    <Shield size={12} /> {escrowLabels[rental.escrow.status] || rental.escrow.status}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-bold" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>
                                            {rental.property?.title || `Rental #${rental.id}`}
                                        </h4>

                                        <div className="flex gap-4 mt-1" style={{ flexWrap: 'wrap' }}>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <MapPin size={12} /> {rental.property?.address}
                                            </span>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(rental.startDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })} —
                                                {new Date(rental.endDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                            <div>
                                                <span className="text-xs text-muted">Rent Paid</span>
                                                <p className="font-bold" style={{ color: 'var(--color-primary)' }}>
                                                    ₦{Number(rental.totalPaid).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <span className="text-xs text-muted">Rental ID</span>
                                                    <p className="font-bold text-sm">#{rental.id}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/tenant/messages?startThreadWith=${rental.property?.landlordId}&rentalId=${rental.id}&title=${encodeURIComponent(rental.property?.title)}`}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        <MessageCircle size={14} style={{ marginRight: 4 }} />
                                                        Chat Landlord
                                                    </Link>
                                                    <button
                                                        onClick={() => setSigningRental(rental)}
                                                        className={`btn btn-sm ${rental.agreement?.tenantSigned ? 'btn-ghost text-success' : 'btn-primary'}`}
                                                        disabled={rental.agreement?.tenantSigned}
                                                    >
                                                        {rental.agreement?.tenantSigned ? (
                                                            <><CheckCircle size={14} style={{ marginRight: 4 }} /> Signed</>
                                                        ) : (
                                                            <><FileText size={14} style={{ marginRight: 4 }} /> Sign Agreement</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const { generateRentalReceipt } = await import('@/lib/receiptGenerator');
                                                            generateRentalReceipt({
                                                                tenantName: `${rental.tenant.firstName} ${rental.tenant.lastName}`,
                                                                landlordName: `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`,
                                                                propertyTitle: rental.property.title,
                                                                propertyAddress: rental.property.address,
                                                                rentalId: rental.id,
                                                                paymentRef: rental.paystackRef || 'N/A',
                                                                amount: rental.rentAmount,
                                                                serviceFee: rental.serviceFee,
                                                                totalPaid: rental.totalPaid,
                                                                date: rental.createdAt
                                                            });
                                                        }}
                                                        className="btn btn-sm btn-outline"
                                                    >
                                                        <FileText size={14} style={{ marginRight: 4 }} />
                                                        Receipt
                                                    </button>
                                                    {rental.escrow?.status === 'HELD' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{ background: 'var(--color-success)', color: 'white' }}
                                                                onClick={async () => {
                                                                    if (confirm('Are you sure you want to confirm access and release the funds to the landlord? This cannot be undone.')) {
                                                                        try {
                                                                            const res = await fetch('/api/escrow/release', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ rentalId: rental.id, action: 'confirm_access' })
                                                                            });
                                                                            const data = await res.json();
                                                                            if (res.ok) {
                                                                                alert(data.message);
                                                                                window.location.reload();
                                                                            } else {
                                                                                alert(data.error);
                                                                            }
                                                                        } catch (e) {
                                                                            alert('Failed to release funds');
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <CheckCircle size={14} style={{ marginRight: 4 }} />
                                                                Release Funds
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline"
                                                                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                                onClick={() => handleDispute(rental.escrow.id)}
                                                            >
                                                                <AlertTriangle size={14} style={{ marginRight: 4 }} />
                                                                Raise Dispute
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {signingRental && (
                <SignaturePad 
                    title={`Sign Agreement for ${signingRental.property?.title}`}
                    onSave={handleSign}
                    onCancel={() => setSigningRental(null)}
                />
            )}
        </div>
    );
}