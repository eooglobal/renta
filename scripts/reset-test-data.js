const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeDelete(modelName) {
  if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
    await prisma[modelName].deleteMany();
  } else {
    console.log(`  ℹ️ Skipping ${modelName} (model not generated in Prisma client)`);
  }
}

async function resetTestData() {
  console.log('🧹 Cleaning up test properties, rentals, transactions, and stats...');

  // 1. Delete Rental Sub-entities
  console.log('- Cleaning rental agreements & maintenance requests...');
  await safeDelete('rentalAgreement');
  await safeDelete('maintenanceRequest');

  // 2. Delete Financial Records & Escrows
  console.log('- Cleaning commissions, payments, and escrows...');
  await safeDelete('commission');
  await safeDelete('payment');
  await safeDelete('escrow');

  // 3. Delete Rentals
  console.log('- Cleaning rental records...');
  await safeDelete('rental');

  // 4. Delete Property Sub-entities & Properties
  console.log('- Cleaning inspection requests, slots, media, and properties...');
  await safeDelete('inspectionRequest');
  await safeDelete('inspectionSlot');
  await safeDelete('propertyImage');
  await safeDelete('propertyVideo');
  await safeDelete('property');

  // 5. Delete Leads, Messages & Notifications
  console.log('- Cleaning scout leads, affiliate referrals, messages, and notifications...');
  await safeDelete('scoutLead');
  await safeDelete('affiliateReferral');
  await safeDelete('message');
  await safeDelete('notification');

  // 6. Delete Transactions & Withdrawals
  console.log('- Cleaning transactions and withdrawal requests...');
  await safeDelete('transaction');
  await safeDelete('withdrawalRequest');

  // 7. Reset Wallets to Default (0.00)
  if (prisma.wallet) {
    console.log('- Resetting wallet balances to ₦0.00 for all users...');
    await prisma.wallet.updateMany({
      data: {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });
  }

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
