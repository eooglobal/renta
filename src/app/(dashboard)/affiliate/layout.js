import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
    title: 'Affiliate Dashboard — Renta',
};

export default function AffiliateLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
