'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ReferralLinkWidget() {
    const { data: session } = useSession();
    const toast = useToast();
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    if (!session || session.user.role !== 'AFFILIATE') return null;

    const referralCode = `AFF${session.user.id}`;
    const referralLink = `${baseUrl}/register?ref=${referralCode}&role=tenant`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success('Link Copied!', 'Your affiliate tracking link has been copied to your clipboard.');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Copy Failed', 'Could not copy link to clipboard.');
        }
    };

    return (
        <div className="card" style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', padding: '20px' }}>
            <h3 className="mb-1" style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
                Your Unique Affiliate Referral Link
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Share this link on social media or direct messages. Anyone who registers will earn you 2% lifetime commission on every rent payment.
            </p>

            <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <input
                    type="text"
                    readOnly
                    value={referralLink}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--text-main)',
                        background: 'transparent',
                        minWidth: 0
                    }}
                />
                <button
                    onClick={copyToClipboard}
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
                    {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
                </button>
            </div>
        </div>
    );
}
