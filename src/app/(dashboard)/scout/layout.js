import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
    title: 'Scout Dashboard — Renta',
};

export default function ScoutLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
