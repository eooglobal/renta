import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPaymentDestination, resolveAccount } from '@/lib/paymentGateway';

const EARNING_ROLES = new Set(['LANDLORD', 'SCOUT', 'AFFILIATE']);

function normalizeWords(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function accountNameMatchesUser(accountName, user) {
  const accountWords = normalizeWords(accountName);
  const firstName = String(user.firstName || '').toLowerCase();
  const lastName = String(user.lastName || '').toLowerCase();

  const matches = (name) => accountWords.some((word) => word.includes(name) || name.includes(word));
  return Boolean(firstName && lastName && matches(firstName) && matches(lastName));
}

async function requireEarningSession() {
  const session = await auth();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!EARNING_ROLES.has(session.user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Only landlords, scouts, and affiliates can set up payout destinations' },
        { status: 403 }
      ),
    };
  }

  return { session };
}

export async function GET() {
  try {
    const { session, error } = await requireEarningSession();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id, 10) },
      select: {
        role: true,
        ninStatus: true,
        bankName: true,
        bankAccount: true,
        bankCode: true,
        bankAccountName: true,
        paymentSetupStatus: true,
        paymentSetupVerifiedAt: true,
        paystackSubaccountCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      role: user.role,
      kycStatus: user.ninStatus,
      paymentSetupStatus: user.paymentSetupStatus,
      paymentSetupVerifiedAt: user.paymentSetupVerifiedAt,
      bank: {
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankCode: user.bankCode,
        accountName: user.bankAccountName,
      },
      hasSubaccount: Boolean(user.paystackSubaccountCode),
      paystackSubaccountCode: user.paystackSubaccountCode,
    });
  } catch (error) {
    console.error('Payment setup fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch payout setup' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session, error } = await requireEarningSession();
    if (error) return error;

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const bankCode = String(body.bankCode || '').trim();
    const bankName = String(body.bankName || '').trim();
    const bankAccount = String(body.bankAccount || '').replace(/\D/g, '');

    if (!bankCode || !bankName || !bankAccount) {
      return NextResponse.json({ error: 'Bank name, bank code, and account number are required' }, { status: 400 });
    }

    if (bankAccount.length !== 10) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ninStatus: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.ninStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Identity verification required before payout setup. Please complete verification first.' },
        { status: 403 }
      );
    }

    const resolved = await resolveAccount(bankAccount, bankCode);
    const accountName = resolved.account_name;

    if (!accountName || !accountNameMatchesUser(accountName, user)) {
      return NextResponse.json(
        { error: `The bank account name (${accountName || 'Unknown'}) does not match your Renta profile name (${user.firstName} ${user.lastName}).` },
        { status: 400 }
      );
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const subaccount = await createPaymentDestination({
      businessName: fullName,
      bankCode,
      accountNumber: bankAccount,
      percentageCharge: 0,
      contact: {
        name: fullName,
        email: user.email,
        phone: user.phone,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        bankName,
        bankAccount,
        bankCode,
        bankAccountName: accountName,
        paystackSubaccountCode: subaccount.subaccount_code,
        paystackSubaccountId: subaccount.id || null,
        paymentSetupStatus: 'VERIFIED',
        paymentSetupVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Payout setup completed',
      paymentSetupStatus: 'VERIFIED',
      bank: {
        bankName,
        bankAccount,
        bankCode,
        accountName,
      },
      paystackSubaccountCode: subaccount.subaccount_code,
    });
  } catch (error) {
    console.error('Payment setup error:', error);
    return NextResponse.json({ error: 'Failed to complete payout setup' }, { status: 500 });
  }
}
