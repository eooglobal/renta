'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Info, ShieldCheck, CreditCard, MessageSquare, Calendar } from 'lucide-react';
import styles from './NotificationCenter.module.css';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=10');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        // Click outside to close
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (id = null) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(id ? { notificationId: id } : { all: true })
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'VERIFICATION': return <ShieldCheck size={16} />;
            case 'PAYMENT': return <CreditCard size={16} />;
            case 'MESSAGE': return <MessageSquare size={16} />;
            case 'INSPECTION': return <Calendar size={16} />;
            default: return <Info size={16} />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.bellButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className={styles.markAll} onClick={() => markAsRead()}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className={styles.list}>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.link || '#'}
                                    className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                                    onClick={() => {
                                        if (!notif.isRead) markAsRead(notif.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className={styles.iconWrapper}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className={styles.itemContent}>
                                        <h5>{notif.title}</h5>
                                        <p>{notif.message}</p>
                                        <span className={styles.time}>{formatTime(notif.createdAt)}</span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className={styles.empty}>
                                <Bell size={32} />
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <Link href="/notifications" onClick={() => setIsOpen(false)}>
                            See all activity
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
