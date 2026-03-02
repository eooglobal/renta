'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import styles from './DashboardLayout.module.css';

import {
    Home, Search, FileText, Wrench, MessageSquare, User,
    Building, Plus, Users, Wallet, ClipboardList, Link as LinkIcon,
    Shield, DollarSign, AlertTriangle, Settings, LogOut, Menu, X
} from 'lucide-react';

const MENU_ITEMS = {
    TENANT: [
        { href: '/tenant', icon: Home, label: 'Dashboard' },
        { href: '/tenant/search', icon: Search, label: 'Find Apartments' },
        { href: '/tenant/rentals', icon: FileText, label: 'My Rentals' },
        { href: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
        { href: '/tenant/messages', icon: MessageSquare, label: 'Messages' },
        { href: '/tenant/profile', icon: User, label: 'Profile' },
    ],
    LANDLORD: [
        { href: '/landlord', icon: Home, label: 'Dashboard' },
        { href: '/landlord/properties', icon: Building, label: 'My Properties' },
        { href: '/landlord/properties/new', icon: Plus, label: 'Add Property' },
        { href: '/landlord/tenants', icon: Users, label: 'Tenants' },
        { href: '/landlord/payments', icon: Wallet, label: 'Payments' },
        { href: '/landlord/maintenance', icon: Wrench, label: 'Maintenance' },
        { href: '/landlord/messages', icon: MessageSquare, label: 'Messages' },
        { href: '/landlord/profile', icon: User, label: 'Profile' },
    ],
    SCOUT: [
        { href: '/scout', icon: Home, label: 'Dashboard' },
        { href: '/scout/leads', icon: ClipboardList, label: 'My Leads' },
        { href: '/scout/leads/new', icon: Plus, label: 'Submit Lead' },
        { href: '/scout/earnings', icon: DollarSign, label: 'Earnings' },
        { href: '/scout/profile', icon: User, label: 'Profile' },
    ],
    AFFILIATE: [
        { href: '/affiliate', icon: Home, label: 'Dashboard' },
        { href: '/affiliate/links', icon: LinkIcon, label: 'Referral Links' },
        { href: '/affiliate/earnings', icon: DollarSign, label: 'Earnings' },
        { href: '/affiliate/profile', icon: User, label: 'Profile' },
    ],
    ADMIN: [
        { href: '/admin', icon: Home, label: 'Dashboard' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/properties', icon: Building, label: 'Properties' },
        { href: '/admin/rentals', icon: FileText, label: 'Rentals' },
        { href: '/admin/escrow', icon: Shield, label: 'Escrow' },
        { href: '/admin/commissions', icon: DollarSign, label: 'Commissions' },
        { href: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
        { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
};

export default function DashboardLayout({ children }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const role = session?.user?.role || 'TENANT';
    const menuItems = MENU_ITEMS[role] || MENU_ITEMS.TENANT;
    const userName = session?.user?.firstName || 'User';

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <div className={styles.layout}>
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.sidebarLogo}>Renta</Link>
                    <button
                        className={styles.closeSidebar}
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                <nav className={styles.sidebarNav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className={styles.navIcon}><item.icon size={20} /></span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{session?.user?.name}</span>
                            <span className={styles.userRole}>{role}</span>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className={styles.signOutBtn}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Top Bar */}
                <header className={styles.topbar}>
                    <button
                        className={styles.menuToggle}
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div className={styles.topbarRight}>
                        <span className={`badge badge-${role === 'ADMIN' ? 'info' : 'primary'}`}>
                            {role}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
