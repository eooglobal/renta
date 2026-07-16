'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let _idCounter = 0;

// ── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        // Mark as exiting (triggers slide-out animation)
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        // Remove after animation
        timers.current[id] = setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            delete timers.current[id];
        }, 350);
    }, []);

    const toast = useCallback(
        ({ type = 'info', title, message, duration = 5000, action }) => {
            const id = ++_idCounter;
            setToasts((prev) => [...prev, { id, type, title, message, action, exiting: false }]);

            if (duration > 0) {
                timers.current[id] = setTimeout(() => dismiss(id), duration);
            }

            return id;
        },
        [dismiss]
    );

    // Convenience helpers
    const success = useCallback((title, message, opts) => toast({ type: 'success', title, message, ...opts }), [toast]);
    const error   = useCallback((title, message, opts) => toast({ type: 'error',   title, message, duration: 7000, ...opts }), [toast]);
    const warning = useCallback((title, message, opts) => toast({ type: 'warning', title, message, duration: 6000, ...opts }), [toast]);
    const info    = useCallback((title, message, opts) => toast({ type: 'info',    title, message, ...opts }), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
            {children}
            <ToastContainer toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
    success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
};

const config = {
    success: { icon: icons.success, accent: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    error:   { icon: icons.error,   accent: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    warning: { icon: icons.warning, accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { icon: icons.info,    accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
};

// ── Container ─────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }) {
    if (toasts.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(100%) scale(0.96); }
                    to   { opacity: 1; transform: translateX(0)    scale(1); }
                }
                @keyframes toast-out {
                    from { opacity: 1; transform: translateX(0)    scale(1); max-height: 120px; margin-bottom: 12px; }
                    to   { opacity: 0; transform: translateX(100%) scale(0.96); max-height: 0;   margin-bottom: 0; }
                }
                .toast-enter { animation: toast-in  0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .toast-exit  { animation: toast-out 0.35s cubic-bezier(0.4, 0, 1, 1)    forwards; }
            `}</style>
            <div
                role="region"
                aria-label="Notifications"
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '400px',
                    width: 'calc(100vw - 48px)',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((t) => {
                    const c = config[t.type] || config.info;
                    return (
                        <div
                            key={t.id}
                            role="alert"
                            className={t.exiting ? 'toast-exit' : 'toast-enter'}
                            style={{
                                background: '#fff',
                                border: `1px solid ${c.border}`,
                                borderRadius: '10px',
                                padding: '14px 16px',
                                boxShadow: '0 14px 34px rgba(16,24,40,0.12), 0 2px 6px rgba(16,24,40,0.05)',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                pointerEvents: 'auto',
                                cursor: 'default',
                            }}
                        >
                            {/* Icon */}
                            <span style={{ color: c.accent, background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {c.icon}
                            </span>

                            {/* Body */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {t.title && (
                                    <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '14px', color: '#111', lineHeight: 1.3 }}>
                                        {t.title}
                                    </p>
                                )}
                                {t.message && (
                                    <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                                        {t.message}
                                    </p>
                                )}
                                {t.action && (
                                    <button
                                        onClick={t.action.onClick}
                                        style={{
                                            marginTop: '8px', padding: '4px 12px', fontSize: '12px',
                                            fontWeight: 600, background: c.accent, color: '#fff',
                                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        }}
                                    >
                                        {t.action.label}
                                    </button>
                                )}
                            </div>

                            {/* Close */}
                            <button
                                onClick={() => dismiss(t.id)}
                                aria-label="Dismiss notification"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#aaa', flexShrink: 0, padding: '2px',
                                    display: 'flex', alignItems: 'center', marginTop: '-2px',
                                    borderRadius: '4px', lineHeight: 1,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
