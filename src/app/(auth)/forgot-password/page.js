'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, Send, CheckCircle2 } from 'lucide-react';
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
                    ← Back to log in
                </Link>

                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.authLogo}>Renta</Link>
                        <h2>Forgot Password?</h2>
                        <p>Enter your email address to receive a 6-digit verification code</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Account Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="spinner"></span>
                                    Sending Code...
                                </span>
                            ) : (
                                'Send Reset Code'
                            )}
                        </button>
                    </form>

                    <p className={styles.authSwitch}>
                        Remember your password?{' '}
                        <Link href="/login">Log in</Link>
                    </p>
                </div>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authRightContent}>
                    <h2>Account recovery made easy.</h2>
                    <p>We keep your Renta account secure with verified reset codes.</p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>Instant 6-digit verification email</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>Secure password encryption</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>24/7 account protection</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
