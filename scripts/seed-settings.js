const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSettings() {
    const settings = [
        // Fee Architecture
        { key: 'platform_fee_percent', value: '10', type: 'number', label: 'Platform Service Fee (%)', group: 'fees', description: 'Total platform service fee charged to tenants on each rental transaction.' },
        { key: 'scout_commission_percent', value: '3', type: 'number', label: 'Scout Commission (%)', group: 'fees', description: 'Percentage of the platform fee allocated to scouts for property leads.' },
        { key: 'affiliate_commission_percent', value: '2', type: 'number', label: 'Affiliate Commission (%)', group: 'fees', description: 'Percentage of the platform fee allocated to affiliates for referrals.' },
        { key: 'featured_listing_price', value: '5000', type: 'number', label: 'Featured Listing Price (₦)', group: 'fees', description: 'Price charged to landlords for promoting a listing as featured.' },

        // Payouts & Escrow
        { key: 'min_withdrawal_amount', value: '10000', type: 'number', label: 'Minimum Withdrawal (₦)', group: 'payouts', description: 'Minimum amount a user must have in their wallet to request a withdrawal.' },
        { key: 'escrow_release_days', value: '7', type: 'number', label: 'Escrow Release Period (Days)', group: 'payouts', description: 'Number of days after tenant move-in confirmation before escrow is automatically released to the landlord.' },

        // Platform Info
        { key: 'maintenance_contact', value: '+234 800 123 4567', type: 'string', label: 'Maintenance Contact', group: 'platform', description: 'Phone number tenants and landlords can use for emergency maintenance support.' },
        { key: 'support_email', value: 'support@renta.com', type: 'string', label: 'Support Email', group: 'platform', description: 'Email address for customer support inquiries.' },
        { key: 'max_property_images', value: '10', type: 'number', label: 'Max Property Images', group: 'platform', description: 'Maximum number of images a landlord can upload per property listing.' },
    ];

    console.log('Seeding platform settings...');

    for (const setting of settings) {
        await prisma.platformSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value, label: setting.label, description: setting.description },
            create: setting,
        });
        console.log(`  ✓ ${setting.key} = ${setting.value}`);
    }

    console.log('Settings seeded successfully!');
    await prisma.$disconnect();
}

seedSettings().catch((e) => {
    console.error(e);
    process.exit(1);
});
