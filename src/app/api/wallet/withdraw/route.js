import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        // ── KYC check — must be verified before withdrawal ──
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ninStatus: true, firstName: true, lastName: true },
        });

        if (!user || user.ninStatus !== 'VERIFIED') {
            return NextResponse.json(
                { error: 'Identity verification required before requesting a withdrawal. Please complete KYC on your profile page.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { amount, bankName, bankAccount, bankCode, accountName } = body;

        if (!accountName) {
            return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
        }

        // Validate account name against user's registered name
        const accountWords = accountName.toLowerCase().split(/\s+/);
        const userFirstName = user.firstName.toLowerCase();
        const userLastName = user.lastName.toLowerCase();
        const matchFirst = accountWords.some(word => word.includes(userFirstName) || userFirstName.includes(word));
        const matchLast = accountWords.some(word => word.includes(userLastName) || userLastName.includes(word));

        if (!matchFirst || !matchLast) {
            return NextResponse.json(
                { error: `The bank account name (${accountName}) does not match your registered name on Renta (${user.firstName} ${user.lastName}).` },
                { status: 400 }
            );
        }

        const amountNum = Number(amount);


        if (!amountNum || amountNum <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        if (!bankName || !bankAccount) {
            return NextResponse.json({ error: 'Bank details are required' }, { status: 400 });
        }

        // We need a transaction to prevent double-spending
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (Number(wallet.balance) < amountNum) {
                throw new Error('Insufficient balance');
            }

            // Deduct from balance immediately
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amountNum }
                }
            });

            // Create the withdrawal request
            const withdrawalRequest = await tx.withdrawalRequest.create({
                data: {
                    walletId: wallet.id,
                    amount: amountNum,
                    status: 'PENDING',
                    bankName,
                    bankAccount,
                    bankCode: bankCode || null,
                }
            });

            // Create the debit transaction
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amountNum,
                    type: 'DEBIT',
                    description: `Withdrawal to ${bankName} (${bankAccount})${accountName ? ` — ${accountName}` : ''}`,
                    referenceId: String(withdrawalRequest.id),
                    referenceType: 'WITHDRAWAL'
                }
            });

            return { wallet: updatedWallet, withdrawalRequest };
        });

        return NextResponse.json({
            message: 'Withdrawal request submitted successfully',
            data: result.withdrawalRequest
        });
    } catch (error) {
        console.error('Withdrawal error:', error);

        if (error.message === 'Insufficient balance' || error.message === 'Wallet not found') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to process withdrawal request' }, { status: 500 });
    }
}
