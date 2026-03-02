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
        const body = await request.json();
        const { amount, bankName, bankAccount, bankCode } = body;

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
                    bankCode
                }
            });

            // Create the debit transaction
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amountNum,
                    type: 'DEBIT',
                    description: `Withdrawal request to ${bankName} (${bankAccount})`,
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
