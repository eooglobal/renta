'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, Home, MapPin, Calendar, Shield, CheckCircle, Clock, AlertTriangle, MessageCircle, Download } from 'lucide-react';
import Link from 'next/link';
import RentalAgreementModal from '@/components/RentalAgreementModal';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDisplayId } from '@/lib/idFormatter';

const statusConfig = {
    PENDING: { label: 'Pending', badge: 'badge-pending', icon: Clock },
    ACTIVE: { label: 'Active', badge: 'badge-verified', icon: CheckCircle },
    COMPLETED: { label: 'Completed', badge: 'badge-info', icon: CheckCircle },
    DISPUTED: { label: 'Disputed', badge: 'badge-error', icon: AlertTriangle },
    CANCELLED: { label: 'Cancelled', badge: 'badge-error', icon: AlertTriangle },
};

const escrowLabels = {
    PENDING: 'Payment Processing',
    HELD: 'Payment Secured',
    RELEASED: 'Payment Remitted',
    DISPUTED: 'Payment Disputed',
    REFUNDED: 'Payment Refunded',
};

export default function TenantRentalsPage() {
    const toast = useToast();
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [signingRental, setSigningRental] = useState(null);
    const [confirmMoveInRentalId, setConfirmMoveInRentalId] = useState(null);
    const [moveInLoading, setMoveInLoading] = useState(false);

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

    const handleSign = async (typedName) => {
        if (!signingRental) return;

        const res = await fetch(`/api/rentals/${signingRental.id}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature: typedName, role: 'TENANT' })
        });

        if (res.ok) {
            // Refresh data after signing (modal stays open for download)
            fetchRentals();
        } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to sign agreement');
        }
    };

    const handleDispute = async (rental) => {
        const isDirectSplit = rental.paymentMode === 'DIRECT_SPLIT';
        const reason = window.prompt(
            isDirectSplit
                ? 'Please explain the issue. Renta support will review this direct split payment case and contact you.'
                : 'Please detail the reason for the dispute. This will halt payment release until an Admin reviews it.'
        );
        if (!reason) return;
        if (reason.length < 10) {
            toast.error('Reason Too Short', 'Please provide a more detailed reason for the dispute (at least 10 characters).');
            return;
        }

        const endpoint = isDirectSplit
            ? `/api/rentals/${rental.id}/dispute`
            : `/api/escrow/${rental.escrow?.id}/dispute`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Dispute Logged', data.message || 'Your dispute has been logged successfully.');
                await fetchRentals();
            } else {
                toast.error('Dispute Error', data.error || 'Failed to submit dispute.');
            }
        } catch (err) {
            toast.error('Network Error', 'Failed to submit dispute.');
        }
    };

    const handleConfirmMoveIn = async (rentalId) => {
        setMoveInLoading(true);
        try {
            const res = await fetch('/api/escrow/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rentalId, action: 'confirm_access' })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Move-In Confirmed', data.message || 'Payment released to landlord.');
                setConfirmMoveInRentalId(null);
                await fetchRentals();
            } else {
                toast.error('Release Failed', data.error || 'Failed to release funds.');
            }
        } catch (e) {
            toast.error('Action Failed', 'Failed to release funds.');
        } finally {
            setMoveInLoading(false);
        }
    };

    // Downloads are handled server-side; no client-side bundle needed

    return (
        <div className="fade-in">
            <header style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>My Rentals</h1>
                <p className="text-muted">Track all your rental agreements and payment status.</p>
            </header>

            <ConfirmModal
                isOpen={!!confirmMoveInRentalId}
                title={`Confirm Move-In Access (${formatDisplayId('RNT', confirmMoveInRentalId)})`}
                message="Are you sure you want to confirm access to this property? This will release the secured rent payment to the landlord and cannot be undone."
                confirmText="Confirm & Release Rent"
                variant="primary"
                loading={moveInLoading}
                onConfirm={() => handleConfirmMoveIn(confirmMoveInRentalId)}
                onClose={() => setConfirmMoveInRentalId(null)}
            />

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
                        const tenantName = rental.tenant
                            ? `${rental.tenant.firstName} ${rental.tenant.lastName}`
                            : 'Tenant';
                        const landlordName = rental.property?.landlord
                            ? `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`
                            : 'Landlord';

                        return (
                            <div key={rental.id} className="card">
                                {/* Card main row — stacks on mobile, side-by-side on desktop */}
                                <div className="rental-card-row">
                                    {/* Property Image */}
                                    {image && (
                                        <div className="rental-card-image">
                                            <Image
                                                src={image}
                                                alt={rental.property?.title || 'Property Image'}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="(max-width: 640px) 100vw, 140px"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="rental-card-content">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '600', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {formatDisplayId('RNT', rental.id)}
                                            </span>
                                            <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                <StatusIcon size={12} /> {status.label}
                                            </span>
                                            {rental.escrow && (
                                                <span className="badge badge-primary flex items-center gap-1">
                                                    <Shield size={12} /> {escrowLabels[rental.escrow.status] || rental.escrow.status}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-bold" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {rental.property?.title || `Rental ${formatDisplayId('RNT', rental.id)}`}
                                        </h4>

                                        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <MapPin size={12} /> {rental.property?.address}
                                            </span>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(rental.startDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })} —&nbsp;
                                                {new Date(rental.endDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                            </span>
                                        </div>

                                        {/* Bottom row */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-4)',
                                            marginTop: 'var(--space-4)',
                                            paddingTop: 'var(--space-4)',
                                            borderTop: '1px solid var(--border-color)',
                                        }}>
                                            {/* Amount */}
                                            <div>
                                                <span className="text-xs text-muted">Rent Paid</span>
                                                <p className="font-bold" style={{ color: 'var(--color-primary)' }}>
                                                    ₦{Number(rental.totalPaid).toLocaleString()}
                                                </p>
                                                <span className="text-xs text-muted">Rental ID: <strong>#{rental.id}</strong></span>
                                            </div>

                                            {/* Buttons — wrap on small screens */}
                                            <div style={{
                                                display: 'flex',
                                                gap: 'var(--space-2)',
                                                flexWrap: 'wrap',
                                                justifyContent: 'flex-start',
                                                width: '100%',
                                                maxWidth: '100%',
                                            }}>
                                                {/* Chat Landlord */}
                                                <Link
                                                    href={`/tenant/messages?startThreadWith=${rental.property?.landlordId}&rentalId=${rental.id}&title=${encodeURIComponent(rental.property?.title || '')}`}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <MessageCircle size={14} style={{ marginRight: 4 }} />
                                                    Chat Landlord
                                                </Link>

                                                {/* Sign Agreement / Signed + Download */}
                                                {rental.agreement?.tenantSigned ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-ghost text-success"
                                                            disabled
                                                            style={{ cursor: 'default' }}
                                                        >
                                                            <CheckCircle size={14} style={{ marginRight: 4 }} /> Signed
                                                        </button>
                                                        <a
                                                            href={`/api/tenant/rentals/${rental.id}/contract`}
                                                            download
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            <Download size={14} style={{ marginRight: 4 }} />
                                                            Contract
                                                        </a>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setSigningRental(rental)}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        <FileText size={14} style={{ marginRight: 4 }} /> Sign Agreement
                                                    </button>
                                                )}

                                                {/* Download Receipt */}
                                                <a
                                                    href={`/api/tenant/rentals/${rental.id}/receipt`}
                                                    download
                                                    className="btn btn-sm btn-outline"
                                                >
                                                    <Download size={14} style={{ marginRight: 4 }} />
                                                    Download Receipt
                                                </a>

                                                {/* Payment actions */}
                                                {rental.escrow?.status === 'HELD' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: 'var(--color-success)', color: 'white' }}
                                                            onClick={() => setConfirmMoveInRentalId(rental.id)}
                                                        >
                                                            <CheckCircle size={14} style={{ marginRight: 4 }} />
                                                            Confirm Move-In
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                            onClick={() => handleDispute(rental)}
                                                        >
                                                            <AlertTriangle size={14} style={{ marginRight: 4 }} />
                                                            Raise Dispute
                                                        </button>
                                                    </>
                                                )}

                                                {/* Direct split dispute action */}
                                                {rental.paymentMode === 'DIRECT_SPLIT' && rental.status === 'ACTIVE' && (
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                        onClick={() => handleDispute(rental)}
                                                    >
                                                        <AlertTriangle size={14} style={{ marginRight: 4 }} />
                                                        Raise Dispute
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {signingRental && (() => {
                const tenantName = signingRental.tenant
                    ? `${signingRental.tenant.firstName} ${signingRental.tenant.lastName}`
                    : 'Tenant';
                const landlordName = signingRental.property?.landlord
                    ? `${signingRental.property.landlord.firstName} ${signingRental.property.landlord.lastName}`
                    : 'Landlord';
                return (
                    <RentalAgreementModal
                        rental={signingRental}
                        tenantName={tenantName}
                        landlordName={landlordName}
                        onSave={handleSign}
                        onCancel={() => { setSigningRental(null); fetchRentals(); }}
                    />
                );
            })()}
        </div>
    );
}

// Standalone PDF download for already-signed contracts
async function generateDownloadPDF({ rental, tenantName, landlordName, typedName, signedAt, jsPDF }) {
    const doc = new jsPDF();
    const primaryColor = '#FDA829';
    const black = '#000000';
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    const fmtDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const fmtCurrency = (v) => '₦' + Number(v).toLocaleString('en-NG');

    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setTextColor(primaryColor);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTA', margin, 20);
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('VERIFIED APARTMENT RENTALS', margin, 28);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESIDENTIAL TENANCY AGREEMENT', margin, 37);

    let y = 56;
    doc.setTextColor(black);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rental Agreement #${rental.id}`, margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#7a7a7a');
    doc.text(`Property: ${rental.property?.title || 'N/A'}`, margin, y);
    y += 6;
    doc.text(`Address: ${rental.property?.address || 'N/A'}`, margin, y);
    y += 12;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(black);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTIES', margin, y);
    y += 7;
    doc.setFontSize(9);
    for (const [label, val] of [['Tenant:', tenantName], ['Landlord:', landlordName], ['Property Address:', rental.property?.address || 'N/A']]) {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 35, y);
        y += 6;
    }
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. RENTAL PERIOD', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`From ${fmtDate(rental.startDate)} to ${fmtDate(rental.endDate)}`, margin, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. RENT AND FEES', margin, y);
    y += 7;
    doc.setFontSize(9);
    for (const [label, val] of [
        ['Rent Amount:', fmtCurrency(rental.rentAmount)],
        ['Platform Service Fee:', fmtCurrency(rental.serviceFee)],
        ['Total Amount Paid:', fmtCurrency(rental.totalPaid)],
    ]) {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 50, y);
        y += 6;
    }
    y += 4;

    const clauses = [
        ['4. PAYMENT AND SETTLEMENT TERMS', 'Rental payments made through Renta are processed through the Platform payment gateway. Eligible settlement may be split directly to verified recipients, while Renta keeps the payment record and may support refund, reversal, or dispute review where applicable.'],
        ['5. TENANT OBLIGATIONS', 'Maintain property condition, no subletting without consent, no unlawful use, report damages via Renta.'],
        ['6. LANDLORD OBLIGATIONS', 'Ensure habitable condition, grant peaceful enjoyment, attend to maintenance requests via Renta.'],
        ['7. TERMINATION', 'Either party may terminate with 30 days written notice via Renta. Early termination may result in penalties.'],
        ['8. DISPUTE RESOLUTION', 'Disputes submitted via Renta platform first. If unresolved in 14 days, may proceed to mediation or court.'],
        ['9. ELECTRONIC SIGNATURE', 'Electronic signature is legally binding per Nigerian law.'],
        ['10. GOVERNING LAW', 'Governed by the laws of the Federal Republic of Nigeria.'],
    ];

    for (const [heading, body] of clauses) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(black);
        doc.text(heading, margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#4a4a4a');
        const lines = doc.splitTextToSize(body, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 6;
    }

    if (y > 230) { doc.addPage(); y = 20; }
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setTextColor(black);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TENANT SIGNATURE', margin, y);
    y += 8;

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(14);
    doc.setTextColor('#2a2a2a');
    doc.text(typedName, margin + 6, y + 12);
    y += 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#7a7a7a');
    doc.text(`Signed electronically on: ${fmtDate(signedAt)}`, margin, y);
    y += 6;
    doc.text(`Tenant Name: ${typedName}`, margin, y);
    y += 6;
    doc.text(`Rental Reference: #${rental.id}`, margin, y);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('This is an electronically generated document facilitated by Renta.', margin, 287, { maxWidth: contentWidth });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: 'right' });
    }

    doc.save(`Renta_Agreement_${rental.id}.pdf`);
}
