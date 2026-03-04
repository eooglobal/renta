'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, DollarSign, Shield, Globe, Database, Save, Check, AlertCircle, Loader } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

const groupIcons = {
    fees: DollarSign,
    payouts: Shield,
    platform: Globe,
};

const groupLabels = {
    fees: 'Fee Architecture',
    payouts: 'Security & Payouts',
    platform: 'Platform Configuration',
};

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const [settings, setSettings] = useState({});
    const [editedValues, setEditedValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [savedKeys, setSavedKeys] = useState({});
    const [error, setError] = useState('');

    const isSuperAdmin = session?.user?.adminRole === 'SUPER_ADMIN';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
                // Initialize edited values
                const initial = {};
                Object.values(data.settings).flat().forEach(s => {
                    initial[s.key] = s.value;
                });
                setEditedValues(initial);
            }
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key) => {
        setSaving(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: editedValues[key] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSavedKeys(prev => ({ ...prev, [key]: true }));
            setTimeout(() => setSavedKeys(prev => ({ ...prev, [key]: false })), 2000);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(prev => ({ ...prev, [key]: false }));
        }
    };

    const hasChanged = (key, originalValue) => editedValues[key] !== originalValue;

    // Access Control
    if (session?.user?.role === 'ADMIN' && session?.user?.adminRole !== 'SUPER_ADMIN') {
        return (
            <div className="fade-in flex flex-col items-center justify-center p-12 text-center">
                <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '50%', marginBottom: '16px' }}>
                    <AlertCircle style={{ color: '#ef4444' }} size={48} />
                </div>
                <h3>Access Denied</h3>
                <p className="text-muted" style={{ maxWidth: 400 }}>
                    Only Super Admins can view or modify platform settings.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center" style={{ padding: '80px 0' }}>
                <div className="spinner" style={{ width: 32, height: 32 }}></div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={24} /> Platform Settings
                    </h3>
                    <p className="text-sm text-muted mt-1">Manage fees, commissions, and system configuration. Changes take effect immediately.</p>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div style={{ display: 'grid', gap: '24px' }}>
                {Object.entries(settings).map(([group, items]) => {
                    const Icon = groupIcons[group] || Database;
                    const label = groupLabels[group] || group;

                    return (
                        <div key={group} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-gray-100)' }}>
                                <Icon size={20} className="text-primary" />
                                <h4 style={{ fontWeight: 700, margin: 0 }}>{label}</h4>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {items.map(setting => (
                                    <div key={setting.key} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px', gap: '16px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{setting.label}</div>
                                            {setting.description && (
                                                <div className="text-xs text-muted">{setting.description}</div>
                                            )}
                                        </div>

                                        <input
                                            type={setting.type === 'number' ? 'number' : 'text'}
                                            value={editedValues[setting.key] ?? ''}
                                            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                            disabled={!isSuperAdmin}
                                            className="form-input"
                                            style={{ textAlign: 'right', fontWeight: 600, padding: '8px 12px', fontSize: '0.95rem' }}
                                        />

                                        <div>
                                            {isSuperAdmin && hasChanged(setting.key, setting.value) ? (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ width: '100%' }}
                                                    onClick={() => handleSave(setting.key)}
                                                    disabled={saving[setting.key]}
                                                >
                                                    {saving[setting.key] ? (
                                                        <><Loader size={14} className="spin" /> Saving</>
                                                    ) : (
                                                        <><Save size={14} /> Save</>
                                                    )}
                                                </button>
                                            ) : savedKeys[setting.key] ? (
                                                <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                                    <Check size={16} /> Saved
                                                </span>
                                            ) : (
                                                <span className="text-muted text-sm" style={{ textAlign: 'center', display: 'block' }}>
                                                    {isSuperAdmin ? 'No changes' : 'Read only'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}