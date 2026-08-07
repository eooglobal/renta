'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
                <Link href="/" className={styles.authLogo}>Renta</Link>
                <h2>Set New Password</h2>
                <p>Enter the 6-digit code sent to your email and your new password</p>
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
                    className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="spinner"></span>
                            Resetting Password...
                        </span>
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </form>

            <p className={styles.authSwitch}>
                Didn&rsquo;t receive a code?{' '}
                <Link href="/forgot-password">Resend code</Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.authLeft}>
                <Link href="/forgot-password" className={styles.backLink}>
                    ← Back
                </Link>

                <Suspense fallback={<div className="card text-center p-8 text-muted">Loading reset form...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authRightContent}>
                    <h2>Your account security matters.</h2>
                    <p>Set a strong password to protect your rentals and platform transactions.</p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>Min 8 characters required</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>Encrypted database storage</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}><CheckCircle2 size={16} /></span>
                            <span>Instant login upon update</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
