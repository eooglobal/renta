import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
    title: 'Landlord Dashboard — Renta',
};

export default function LandlordLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
