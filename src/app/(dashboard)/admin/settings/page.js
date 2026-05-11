'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Shield, CreditCard, MessageSquare, Globe, Fingerprint, Loader2 } from 'lucide-react';

const settingGroups = [
    { id: 'PAYSTACK', label: 'Paystack Payments', icon: CreditCard },
    { id: 'PUSHER', label: 'Real-time (Pusher)', icon: MessageSquare },
    { id: 'SMILE_ID', label: 'Identity (Smile ID)', icon: Fingerprint },
    { id: 'GOOGLE_MAPS', label: 'Maps & Location', icon: Globe },
    { id: 'EMAIL', label: 'Email Configuration', icon: RefreshCw },
];

const defaultSettings = [
    { key: 'PAYSTACK_SECRET_KEY', group: 'PAYSTACK', label: 'Secret Key', type: 'password', description: 'Your Paystack Secret Key' },
    { key: 'NEXT_PUBLIC_PAYSTACK_KEY', group: 'PAYSTACK', label: 'Public Key', type: 'text', description: 'Your Paystack Public Key' },
    
    { key: 'PUSHER_APP_ID', group: 'PUSHER', label: 'App ID', type: 'text' },
    { key: 'NEXT_PUBLIC_PUSHER_KEY', group: 'PUSHER', label: 'Key', type: 'text' },
    { key: 'PUSHER_SECRET', group: 'PUSHER', label: 'Secret', type: 'password' },
    { key: 'NEXT_PUBLIC_PUSHER_CLUSTER', group: 'PUSHER', label: 'Cluster', type: 'text' },

    { key: 'SMILE_ID_PARTNER_ID', group: 'SMILE_ID', label: 'Partner ID', type: 'text' },
    { key: 'SMILE_ID_API_KEY', group: 'SMILE_ID', label: 'API Key', type: 'password' },
    { key: 'SMILE_ID_SID_SERVER', group: 'SMILE_ID', label: 'Environment (0=Sandbox, 1=Prod)', type: 'text' },

    { key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', group: 'GOOGLE_MAPS', label: 'API Key', type: 'text' },

    { key: 'EMAIL_SERVER_HOST', group: 'EMAIL', label: 'SMTP Host', type: 'text' },
    { key: 'EMAIL_SERVER_PORT', group: 'EMAIL', label: 'SMTP Port', type: 'text' },
    { key: 'EMAIL_SERVER_USER', group: 'EMAIL', label: 'SMTP User', type: 'text' },
    { key: 'EMAIL_SERVER_PASSWORD', group: 'EMAIL', label: 'SMTP Password', type: 'password' },
    { key: 'EMAIL_FROM', group: 'EMAIL', label: 'From Email', type: 'text' },
];

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({});
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // Key being saved
    const [activeGroup, setActiveGroup] = useState('PAYSTACK');

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                const map = data.settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
                setSettings(map);
                setHealth(data.health);
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (key) => {
        setSaving(key);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: settings[key] })
            });
            if (res.ok) {
                // Refresh health after save
                const updated = await fetch('/api/admin/settings');
                if (updated.ok) {
                    const data = await updated.json();
                    setHealth(data.health);
                }
            }
        } catch (err) {
            console.error('Save failed', err);
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="fade-in max-w-5xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="text-primary" /> Platform Configuration
                    </h1>
                    <p className="text-muted mt-2">Manage API keys and external service integrations without touching code.</p>
                </div>

                {health && (
                    <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${health.isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${health.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {health.isHealthy ? 'Platform Fully Operational' : `${health.missingKeys.length} Critical Keys Missing`}
                    </div>
                )}
            </header>

            {!health?.isHealthy && health?.missingKeys.length > 0 && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <h4 className="text-red-900 font-bold text-sm mb-2 flex items-center gap-2">
                         Attention Required: Missing Credentials
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {health.missingKeys.map(key => (
                            <span key={key} className="px-2 py-1 bg-white border border-red-200 rounded text-[10px] text-red-600 font-mono">
                                {key}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex flex-col gap-2">
                    {settingGroups.map(group => {
                        const Icon = group.icon;
                        return (
                            <button
                                key={group.id}
                                onClick={() => setActiveGroup(group.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                                    activeGroup === group.id 
                                    ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20' 
                                    : 'bg-white hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{group.label}</span>
                            </button>
                        );
                    })}
                </aside>

                {/* Settings Form */}
                <main className="flex-1 bg-white rounded-2xl shadow-sm border p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold">{settingGroups.find(g => g.id === activeGroup).label}</h2>
                        <p className="text-sm text-muted">Configure the credentials for this service.</p>
                    </div>

                    <div className="flex flex-col gap-8">
                        {defaultSettings
                            .filter(s => s.group === activeGroup)
                            .map(field => (
                                <div key={field.key} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{field.key}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type={field.type}
                                            value={settings[field.key] || ''}
                                            onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                                            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        />
                                        <button
                                            onClick={() => handleSave(field.key)}
                                            disabled={saving === field.key}
                                            className="btn btn-primary px-6 flex items-center gap-2 min-w-[120px] justify-center"
                                        >
                                            {saving === field.key ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Update</>}
                                        </button>
                                    </div>
                                    {field.description && <p className="text-xs text-muted">{field.description}</p>}
                                </div>
                            ))
                        }
                    </div>
                </main>
            </div>
            
            <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 items-start">
                <RefreshCw className="text-blue-600 shrink-0 mt-1" />
                <div>
                    <h4 className="text-blue-900 font-bold m-0">Dynamic Configuration Active</h4>
                    <p className="text-sm text-blue-800 m-0 mt-1">
                        Changes to these settings take effect immediately. Sensitive values are masked in the UI but saved securely in the platform database. 
                        If a value is not set here, the platform will fall back to the environment variables defined in the system.
                    </p>
                </div>
            </div>
        </div>
    );
}