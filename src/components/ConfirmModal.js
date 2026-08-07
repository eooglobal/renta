'use client';

export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary', // 'primary' | 'danger' | 'warning'
    loading = false,
    onConfirm,
    onClose
}) {
    if (!isOpen) return null;

    const btnClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div className="fade-in card" style={{
                maxWidth: '420px',
                width: '100%',
                padding: '24px',
                boxShadow: 'var(--shadow-xl)',
                background: '#fff',
                borderRadius: 'var(--radius-xl)'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                    {title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`btn btn-sm ${btnClass}`}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
