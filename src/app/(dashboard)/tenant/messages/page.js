import MessageCenter from '@/components/MessageCenter';

export const metadata = { title: 'Messages - Renta' };

export default function TenantMessagesPage() {
    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>Messages</h1>
                <p className="text-muted">Chat directly with your landlords.</p>
            </header>
            <MessageCenter />
        </div>
    );
}