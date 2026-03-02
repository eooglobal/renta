import { Pickaxe } from 'lucide-react';
import dashStyles from '../../tenant/dashboard.module.css';

export default function Page() {
    return (
        <div className="fade-in">
            <div className={dashStyles.header}>
                <h2>Settings</h2>
            </div>
            <div className="card mt-6" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--color-primary)' }}><Pickaxe size={48} /></div>
                <h3>Coming Soon in Phase 2</h3>
                <p className="text-muted mt-2">
                    This feature is currently under development. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
}