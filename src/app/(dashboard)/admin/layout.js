import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
    title: 'Admin Dashboard — Renta',
};

export default function AdminLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
