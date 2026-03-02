'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                // Fetch session to get role for redirect
                const res = await fetch('/api/auth/session');
                const session = await res.json();

                const roleRoutes = {
                    TENANT: '/tenant',
                    LANDLORD: '/landlord',
                    SCOUT: '/scout',
                    AFFILIATE: '/affiliate',
                    ADMIN: '/admin',
                };

                const redirectPath = roleRoutes[session?.user?.role] || '/tenant';
                router.push(redirectPath);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authLeft}>
                <Link href="/" className={styles.backLink}>← Back to home</Link>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.authLogo}>Renta</Link>
                        <h2>Welcome back</h2>
                        <p>Log in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        {error && (
                            <div className={styles.errorAlert}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="spinner"></span>
                                    Logging in...
                                </span>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <p className={styles.authSwitch}>
                        Don&rsquo;t have an account?{' '}
                        <Link href="/register">Create one</Link>
                    </p>
                </div>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authRightContent}>
                    <h2>Renta makes renting simple.</h2>
                    <p>Verified apartments. Real prices. Escrow protection.</p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>No agent price inflation</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>100% escrow protected</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>Physically verified listings</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
