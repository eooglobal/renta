'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import styles from '../login/login.module.css';
import { useToast } from '@/components/Toast';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();

    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const paramEmail = searchParams.get('email');
        if (paramEmail) {
            setEmail(paramEmail);
        }
    }, [searchParams]);

    const handleReset = async (e) => {
        e.preventDefault();

        if (!email || !otpCode || !newPassword || !confirmPassword) {
            toast.error('Missing Fields', 'Please fill in all fields.');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Weak Password', 'New password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Password Mismatch', 'New password and confirmation password do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    otpCode: otpCode.trim(),
                    newPassword
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Password Reset Successful', 'Your password has been reset. You can now log in.');
                router.push('/login');
            } else {
                toast.error('Reset Failed', data.error || 'Failed to reset password.');
            }
        } catch (err) {
            toast.error('Network Error', 'Something went wrong. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    <Lock size={22} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>Set New Password</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Enter the 6-digit code sent to your email and choose your new password.
                </p>
            </div>

            <form onSubmit={handleReset} className={styles.authForm}>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="otpCode" className="form-label">6-Digit Verification Code</label>
                    <input
                        id="otpCode"
                        type="text"
                        maxLength={6}
                        className="form-input"
                        placeholder="e.g. 849201"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        required
                        style={{ fontFamily: 'monospace', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="Min 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            style={{ paddingRight: '44px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)', background: 'none',
                                border: 'none', cursor: 'pointer', padding: '4px',
                                color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
                            }}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                    style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {loading ? 'Resetting Password...' : <><ShieldCheck size={16} /> Reset Password</>}
                </button>
            </form>

            <div className="text-center mt-6" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Did not receive a code?{' '}
                <Link href="/forgot-password" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                    Resend email
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.authLeft}>
                <Link href="/forgot-password" className={styles.backLink}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
                </Link>

                <Suspense fallback={<div className="card text-center p-8 text-muted">Loading reset form...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
