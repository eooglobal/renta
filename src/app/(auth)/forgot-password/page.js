'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, Send } from 'lucide-react';
import styles from '../login/login.module.css';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Check Your Email', 'Password reset instructions and verification code have been sent.');
                router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
            } else {
                toast.error('Request Failed', data.error || 'Failed to send reset email.');
            }
        } catch (err) {
            toast.error('Network Error', 'Something went wrong. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authLeft}>
                <Link href="/login" className={styles.backLink}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to log in
                </Link>

                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            color: 'var(--text-main)'
                        }}>
                            <KeyRound size={22} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>Forgot Password?</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            No worries! Enter your account email address and we&apos;ll send you a 6-digit verification code to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Account Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    style={{ paddingLeft: '38px' }}
                                />
                                <Mail
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                            style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {loading ? 'Sending Code...' : <><Send size={16} /> Send Reset Code</>}
                        </button>
                    </form>

                    <div className="text-center mt-6" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Remember your password?{' '}
                        <Link href="/login" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
