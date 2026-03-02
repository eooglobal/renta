import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
    title: 'Tenant Dashboard — Renta',
};

export default function TenantLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
