'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

export default function ReferralLinkWidget() {
    const { data: session } = useSession();
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
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    return (
        <div className="card" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)' }}>
            <h3 className="mb-2 flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                <LinkIcon size={18} style={{ color: 'var(--color-primary)' }} /> Your Affiliate Link
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Share this link. Anyone who signs up via this link will be tracked. Whenever they pay rent on Renta, you instantly earn a 2% commission.
            </p>

            <div className="flex" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <input
                    type="text"
                    readOnly
                    value={referralLink}
                    style={{
                        flex: 1,
                        padding: 'var(--space-3) var(--space-4)',
                        border: 'none',
                        outline: 'none',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        minWidth: 0
                    }}
                />
                <button
                    onClick={copyToClipboard}
                    className="btn"
                    style={{
                        borderRadius: 0,
                        background: copied ? 'var(--color-success)' : 'var(--color-primary)',
                        color: copied ? 'white' : 'var(--text-on-primary)',
                        flexShrink: 0
                    }}
                >
                    {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                </button>
            </div>
        </div>
    );
}
