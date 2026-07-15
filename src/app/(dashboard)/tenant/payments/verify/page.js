'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentVerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reference = searchParams.get('reference');

    const [status, setStatus] = useState('verifying'); // verifying | success | failed | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setMessage('No payment reference found.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify?reference=${reference}`);
                const data = await res.json();

                if (res.ok && (data.status === 'success' || data.message?.includes('already verified'))) {
                    setStatus('success');
                    setMessage(data.message || 'Payment verified successfully!');
                } else {
                    setStatus('failed');
                    setMessage(data.message || data.error || 'Payment verification failed.');
                }
            } catch (err) {
                console.error('Verification error:', err);
                setStatus('error');
                setMessage('An error occurred while verifying your payment. Please contact support.');
            }
        };

        verify();
    }, [reference]);

    return (
        <div className="fade-in" style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
            {status === 'verifying' && (
                <div className="card" style={{ padding: 'var(--space-12)' }}>
                    <Loader2 size={56} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-4)', animation: 'spin 1s linear infinite' }} />
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Verifying Payment...</h2>
                    <p className="text-muted">Please wait while we confirm your transaction with Paystack.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="card" style={{ padding: 'var(--space-12)' }}>
                    <CheckCircle size={64} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4)' }} />
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}>
                        Payment Successful!
                    </h2>
                    <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
                        {message}
                    </p>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
                        Your receipt and rental record are now available. Contact Renta support immediately if there is an access issue.
                    </p>
                    <Link href="/tenant/rentals" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                        View My Rentals
                    </Link>
                </div>
            )}

            {(status === 'failed' || status === 'error') && (
                <div className="card" style={{ padding: 'var(--space-12)' }}>
                    <XCircle size={64} style={{ color: 'var(--color-error)', margin: '0 auto var(--space-4)' }} />
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'var(--color-error)' }}>
                        {status === 'failed' ? 'Payment Failed' : 'Verification Error'}
                    </h2>
                    <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
                        {message}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <Link href="/tenant/search" className="btn btn-primary" style={{ width: '100%' }}>
                            Browse Listings
                        </Link>
                        <Link href="/tenant/rentals" className="btn btn-outline" style={{ width: '100%' }}>
                            View My Rentals
                        </Link>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={
            <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: 'var(--space-12)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p className="text-muted mt-4">Loading...</p>
                </div>
            </div>
        }>
            <PaymentVerifyContent />
        </Suspense>
    );
}
