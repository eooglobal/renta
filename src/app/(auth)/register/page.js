'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import styles from '../login/login.module.css';
import { useToast } from '@/components/Toast';
import { friendlyError } from '@/lib/errors';

const ROLES = [
    { value: 'TENANT', label: 'Tenant', emoji: '🏠', desc: 'Find apartments' },
    { value: 'LANDLORD', label: 'Landlord', emoji: '🔑', desc: 'List properties' },
    { value: 'SCOUT', label: 'Scout', emoji: '🔍', desc: 'Earn commissions' },
    { value: 'AFFILIATE', label: 'Affiliate', emoji: '🔗', desc: 'Refer & earn' },
];

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className={styles.authPage}><div className={styles.authLeft}><div className={styles.authCard}><div className="spinner" style={{ margin: '100px auto' }}></div></div></div></div>}>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    const router = useRouter();
    const toast = useToast();
    const searchParams = useSearchParams();
    const defaultRole = searchParams.get('role')?.toUpperCase() || 'TENANT';

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: ROLES.find(r => r.value === defaultRole) ? defaultRole : 'TENANT',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords Don't Match", "Your password and confirmation password are different. Please re-enter them.");
            setLoading(false);
            return;
        }

        try {
            // Check for referral code stored by our global ReferralTracker
            const refCode = localStorage.getItem('renta_referral_code');

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    password: formData.password,
                    role: formData.role,
                    ref: refCode || undefined // Attach the referral code if it exists
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const friendly = friendlyError(data.error || 'Registration failed');
                toast.error(friendly.title, friendly.message);
                return;
            }

            // Auto-login after registration
            const { signIn } = await import('next-auth/react');
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                // Registration succeeded but login failed — redirect to login
                router.push('/login?registered=true');
            } else {
                const roleRoutes = {
                    TENANT: '/tenant',
                    LANDLORD: '/landlord',
                    SCOUT: '/scout',
                    AFFILIATE: '/affiliate',
                    ADMIN: '/admin',
                };
                router.push(roleRoutes[formData.role] || '/tenant');
            }
        } catch (err) {
            const friendly = friendlyError(err);
            toast.error(friendly.title, friendly.message);
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
                        <h2>Create your account</h2>
                        <p>Join Renta and start renting the right way</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.authForm}>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label">I am a</label>
                            <div className={styles.roleGrid}>
                                {ROLES.map((role) => (
                                    <label key={role.value} className={styles.roleOption}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={formData.role === role.value}
                                            onChange={handleChange}
                                        />
                                        <div className={styles.roleCard}>
                                            <span className={styles.roleEmoji}>{role.emoji}</span>
                                            <span>{role.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Name fields */}
                        <div className="flex gap-4">
                            <div className="form-group flex-1">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    className="form-input"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group flex-1">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    name="lastName"
                                    className="form-input"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email" className="form-label">Email Address</label>
                            <input
                                id="reg-email"
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
                            <label htmlFor="phone" className="form-label">Phone Number <span className="text-muted text-xs">(optional)</span></label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="08012345678"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password" className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    style={{ paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: '4px',
                                        color: 'var(--text-muted)', display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    style={{ paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: '4px',
                                        color: 'var(--text-muted)', display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="spinner"></span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className={styles.authSwitch}>
                        Already have an account?{' '}
                        <Link href="/login">Log in</Link>
                    </p>
                </div>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authRightContent}>
                    <h2>Join the trusted rental community.</h2>
                    <p>
                        {formData.role === 'LANDLORD'
                            ? 'List your properties and find verified tenants.'
                            : formData.role === 'SCOUT'
                                ? 'Help connect landlords with Renta and earn 3% commission.'
                                : formData.role === 'AFFILIATE'
                                    ? 'Share listings and earn 2% on successful rentals.'
                                    : 'Find verified apartments at real prices with secure platform payments.'}
                    </p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>Free to join</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>verified community</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>Transparent 10% fee only</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
