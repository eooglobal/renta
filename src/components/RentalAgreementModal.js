'use client';

import { useState } from 'react';
import { X, FileText, CheckCircle, Download } from 'lucide-react';

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
}

function ContractText({ rental, tenantName, landlordName }) {
    const property = rental.property;
    const address = property?.address || 'N/A';
    const rentAmount = formatCurrency(rental.rentAmount);
    const serviceFee = formatCurrency(rental.serviceFee);
    const totalPaid = formatCurrency(rental.totalPaid);
    const startDate = formatDate(rental.startDate);
    const endDate = formatDate(rental.endDate);

    return (
        <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ textAlign: 'center', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                RESIDENTIAL TENANCY AGREEMENT
            </p>
            <p style={{ textAlign: 'center', marginBottom: 'var(--space-6)', color: 'var(--text-muted)' }}>
                Facilitated by Renta Platform &bull; Rental #{rental.id}
            </p>

            <p style={{ marginBottom: 'var(--space-4)' }}>
                This Residential Tenancy Agreement (&ldquo;Agreement&rdquo;) is entered into on the date of electronic
                signature by the parties identified below, and is facilitated through the Renta platform.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>1. PARTIES</p>
            <p style={{ marginBottom: 'var(--space-1)' }}><strong>Tenant:</strong> {tenantName}</p>
            <p style={{ marginBottom: 'var(--space-1)' }}><strong>Landlord:</strong> {landlordName}</p>
            <p style={{ marginBottom: 'var(--space-4)' }}><strong>Property Address:</strong> {address}</p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>2. RENTAL PERIOD</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                The tenancy commences on <strong>{startDate}</strong> and expires on <strong>{endDate}</strong>.
                The tenancy shall not be renewed automatically. Any renewal must be agreed in writing through the Renta platform.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>3. RENT AND FEES</p>
            <p style={{ marginBottom: 'var(--space-1)' }}><strong>Rent Amount:</strong> {rentAmount}</p>
            <p style={{ marginBottom: 'var(--space-1)' }}><strong>Platform Service Fee:</strong> {serviceFee}</p>
            <p style={{ marginBottom: 'var(--space-4)' }}><strong>Total Amount Paid:</strong> {totalPaid}</p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>4. PAYMENT AND SETTLEMENT TERMS</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                Rental payments made through Renta are processed through the Platform payment gateway. Eligible settlement may be split directly to verified recipients, while Renta keeps the payment record and may support refund, reversal, or dispute review where applicable.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>5. TENANT OBLIGATIONS</p>
            <p style={{ marginBottom: 'var(--space-1)' }}>(a) The Tenant shall maintain the property in a clean and habitable condition throughout the tenancy.</p>
            <p style={{ marginBottom: 'var(--space-1)' }}>(b) The Tenant shall not sublet the property or any part of it without prior written consent from the Landlord.</p>
            <p style={{ marginBottom: 'var(--space-1)' }}>(c) The Tenant shall not use the property for any unlawful purpose.</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>(d) The Tenant shall promptly report any damage or necessary repairs to the Landlord via the Renta platform.</p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>6. LANDLORD OBLIGATIONS</p>
            <p style={{ marginBottom: 'var(--space-1)' }}>(a) The Landlord shall ensure the property is in a habitable condition at the commencement of the tenancy.</p>
            <p style={{ marginBottom: 'var(--space-1)' }}>(b) The Landlord shall grant the Tenant peaceful enjoyment of the property during the tenancy period.</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>(c) The Landlord shall attend to maintenance requests raised through the Renta platform in a timely manner.</p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>7. TERMINATION</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                Either party may terminate this Agreement by providing at least 30 days written notice via the Renta
                platform prior to the intended termination date, subject to applicable tenancy laws. Early termination
                without proper notice may result in penalties or other remedies determined under Renta policy and applicable law.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>8. DISPUTE RESOLUTION</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                Any disputes arising from this Agreement shall first be submitted through the Renta platform&apos;s
                dispute resolution process. If unresolved within 14 days, the matter may be referred to a mutually
                agreed mediator or, failing agreement, to the appropriate court of jurisdiction in Nigeria.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>9. ELECTRONIC SIGNATURE</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                The parties agree that an electronic signature applied to this Agreement is legally binding and has the
                same force and effect as a handwritten signature, in accordance with the Nigeria Computer (Cyber Crimes)
                Act and the Evidence Act. By typing their full name below, the Tenant confirms they have read,
                understood, and agreed to all terms of this Agreement.
            </p>

            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>10. GOVERNING LAW</p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
                This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic
                of Nigeria. Any legal proceedings shall be conducted in the courts of the state where the property is
                situated.
            </p>
        </div>
    );
}

export default function RentalAgreementModal({ rental, tenantName, landlordName, onSave, onCancel }) {
    const [typedName, setTypedName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [signedAt, setSignedAt] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (typedName.trim().length < 3) return;
        setSubmitting(true);
        try {
            await onSave(typedName.trim());
            setSignedAt(new Date());
            setSigned(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        generateContractPDF({ rental, tenantName, landlordName, typedName, signedAt, jsPDF });
    };

    // Responsive styles
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 'var(--space-4)',
        overflowY: 'auto',
    };

    const modalStyle = {
        background: 'var(--bg-card)',
        borderRadius: isMobile ? 0 : 'var(--radius-xl)',
        width: '100%',
        maxWidth: isMobile ? '100%' : '680px',
        maxHeight: isMobile ? '100dvh' : '92vh',
        minHeight: isMobile ? '100dvh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={{
                    background: 'var(--color-black)',
                    padding: 'var(--space-4) var(--space-6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 'var(--font-extrabold)',
                            fontSize: 'var(--text-xl)',
                            color: 'var(--color-primary)',
                            letterSpacing: '0.05em',
                        }}>RENTA</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-xs)' }}>|</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-sm)' }}>
                            <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Rental Agreement
                        </span>
                    </div>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: 'var(--radius-full)',
                            cursor: 'pointer',
                            padding: 'var(--space-2)',
                            display: 'flex',
                            color: 'white',
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Property name sub-header */}
                <div style={{
                    background: 'var(--color-primary-light)',
                    padding: 'var(--space-3) var(--space-6)',
                    borderBottom: '1px solid var(--border-color)',
                    flexShrink: 0,
                }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary-dark)' }}>
                        {rental.property?.title || `Rental #${rental.id}`}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                        Please read the full agreement before signing.
                    </p>
                </div>

                {/* Contract body — scrollable */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-6)',
                }}>
                    <ContractText rental={rental} tenantName={tenantName} landlordName={landlordName} />

                    {/* Divider */}
                    <div style={{ borderTop: '2px dashed var(--border-color)', margin: 'var(--space-6) 0' }} />

                    {!signed ? (
                        <form onSubmit={handleSubmit}>
                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                                Type your full name to sign this agreement:
                            </p>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={tenantName}
                                value={typedName}
                                onChange={e => setTypedName(e.target.value)}
                                required
                                minLength={3}
                                style={{ marginBottom: 'var(--space-2)' }}
                            />
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                                By typing your full name above and clicking &ldquo;Sign Agreement&rdquo;, you confirm that you have
                                read and agreed to all terms of this contract. This electronic signature is legally binding.
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 2 }}
                                    disabled={submitting || typedName.trim().length < 3}
                                >
                                    {submitting ? 'Signing...' : (
                                        <><CheckCircle size={16} style={{ marginRight: 4 }} /> Sign Agreement</>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            background: 'var(--color-success-light)',
                            borderRadius: 'var(--radius-lg)',
                        }}>
                            <CheckCircle size={40} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-3)' }} />
                            <p style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-success)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
                                Agreement Signed!
                            </p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                                Signed as: <strong>{typedName}</strong> on {formatDate(signedAt)}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="btn btn-primary"
                                >
                                    <Download size={16} style={{ marginRight: 4 }} />
                                    Download Contract PDF
                                </button>
                                <button onClick={onCancel} className="btn btn-outline">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function generateContractPDF({ rental, tenantName, landlordName, typedName, signedAt, jsPDF }) {
    const doc = new jsPDF();
    const primaryColor = '#FDA829';
    const black = '#000000';
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // ---- Header ----
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

    // ---- Title ----
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

    // ---- Parties Section ----
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(black);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTIES', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const parties = [
        [`Tenant:`, tenantName],
        [`Landlord:`, landlordName],
        [`Property Address:`, rental.property?.address || 'N/A'],
    ];
    for (const [label, val] of parties) {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 35, y);
        y += 6;
    }
    y += 4;

    // ---- Rental Period ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. RENTAL PERIOD', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const periodText = `From ${formatDate(rental.startDate)} to ${formatDate(rental.endDate)}`;
    doc.text(periodText, margin, y);
    y += 10;

    // ---- Fees ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. RENT AND FEES', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const fees = [
        ['Rent Amount:', formatCurrency(rental.rentAmount)],
        ['Platform Service Fee:', formatCurrency(rental.serviceFee)],
        ['Total Amount Paid:', formatCurrency(rental.totalPaid)],
    ];
    for (const [label, val] of fees) {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 50, y);
        y += 6;
    }
    y += 4;

    // ---- Contract Clauses ----
    const clauses = [
        ['4. PAYMENT AND SETTLEMENT TERMS',
            'Rental payments made through Renta are processed through the Platform payment gateway. Eligible settlement may be split directly to verified recipients, while Renta keeps the payment record and may support refund, reversal, or dispute review where applicable.'],
        ['5. TENANT OBLIGATIONS',
            'The Tenant shall maintain the property in a clean condition, not sublet without consent, avoid unlawful use, and report damages via the Renta platform promptly.'],
        ['6. LANDLORD OBLIGATIONS',
            'The Landlord shall ensure the property is habitable at commencement, grant peaceful enjoyment, and attend to maintenance requests via the Renta platform.'],
        ['7. TERMINATION',
            'Either party may terminate with 30 days written notice via the Renta platform. Early termination without notice may result in penalties or other remedies under Renta policy.'],
        ['8. DISPUTE RESOLUTION',
            'Disputes shall first be submitted through the Renta platform dispute resolution process. If unresolved in 14 days, the matter may proceed to mediation or the appropriate court.'],
        ['9. ELECTRONIC SIGNATURE',
            'The parties agree that an electronic signature is legally binding and has the same effect as a handwritten signature, in accordance with Nigerian law.'],
        ['10. GOVERNING LAW',
            'This Agreement is governed by the laws of the Federal Republic of Nigeria.'],
    ];

    for (const [heading, body] of clauses) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
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

    // ---- Signature Block ----
    if (y > 230) {
        doc.addPage();
        y = 20;
    }
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setTextColor(black);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TENANT SIGNATURE', margin, y);
    y += 8;

    // Signature name in a styled box
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
    doc.text(`Signed electronically on: ${formatDate(signedAt)}`, margin, y);
    y += 6;
    doc.text(`Tenant Name: ${typedName}`, margin, y);
    y += 6;
    doc.text(`Rental Reference: #${rental.id}`, margin, y);

    // ---- Footer ----
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
            'This is an electronically generated document facilitated by Renta. It is legally binding upon electronic signature.',
            margin, 287, { maxWidth: contentWidth }
        );
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: 'right' });
    }

    doc.save(`Renta_Agreement_${rental.id}_${typedName.replace(/\s+/g, '_')}.pdf`);
}
