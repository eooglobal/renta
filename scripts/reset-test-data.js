const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetTestData() {
  console.log('🧹 Cleaning up test properties, rentals, transactions, and stats...');

  // 1. Delete Rental Sub-entities
  console.log('- Cleaning rental agreements & maintenance requests...');
  await prisma.rentalAgreement.deleteMany();
  await prisma.maintenanceRequest.deleteMany();

  // 2. Delete Financial Records & Escrows
  console.log('- Cleaning commissions, payments, and escrows...');
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.escrow.deleteMany();

  // 3. Delete Rentals
  console.log('- Cleaning rental records...');
  await prisma.rental.deleteMany();

  // 4. Delete Property Sub-entities & Properties
  console.log('- Cleaning inspection requests, slots, media, and properties...');
  await prisma.inspectionRequest.deleteMany();
  await prisma.inspectionSlot.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.propertyVideo.deleteMany();
  await prisma.property.deleteMany();

  // 5. Delete Leads, Messages & Notifications
  console.log('- Cleaning scout leads, affiliate referrals, messages, and notifications...');
  await prisma.scoutLead.deleteMany();
  await prisma.affiliateReferral.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();

  // 6. Delete Transactions & Withdrawals
  console.log('- Cleaning transactions and withdrawal requests...');
  await prisma.transaction.deleteMany();
  await prisma.withdrawalRequest.deleteMany();

  // 7. Reset Wallets to Default (0.00)
  console.log('- Resetting wallet balances to ₦0.00 for all users...');
  await prisma.wallet.updateMany({
    data: {
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
    },
  });

  console.log('✨ SUCCESS: All properties and test stats wiped cleanly.');
  console.log('👤 All user accounts are preserved with reset default balances.');
}

resetTestData()
  .catch((e) => {
    console.error('❌ Error cleaning up test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
