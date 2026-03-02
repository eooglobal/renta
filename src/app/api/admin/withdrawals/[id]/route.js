import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const adminId = parseInt(session.user.id);
        const withdrawalId = parseInt(params.id);
        const body = await request.json();
        const { status, adminNotes } = body;

        const validStatuses = ['PROCESSED', 'REJECTED'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status update. Only PROCESSED or REJECTED allowed via this endpoint.' }, { status: 400 });
        }

        // SECURE TRANSACTION: Process withdrawal
        const result = await prisma.$transaction(async (tx) => {
            const withdrawal = await tx.withdrawalRequest.findUnique({
                where: { id: withdrawalId },
                include: { wallet: true }
            });

            if (!withdrawal) {
                throw new Error('NOT_FOUND');
            }

            if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'APPROVED') {
                throw new Error('INVALID_STATE'); // Already processed or rejected
            }

            const updateData = {
                status,
                processedAt: new Date(),
                processedById: adminId,
            };
            if (adminNotes) updateData.adminNotes = adminNotes;

            const updatedWithdrawal = await tx.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: updateData
            });

            // If REJECTED, refund the user's wallet balance
            if (status === 'REJECTED') {
                await tx.wallet.update({
                    where: { id: withdrawal.walletId },
                    data: {
                        balance: { increment: withdrawal.amount }
                    }
                });

                // Create a refund transaction
                await tx.transaction.create({
                    data: {
                        walletId: withdrawal.walletId,
                        amount: withdrawal.amount,
                        type: 'CREDIT',
                        description: `Refund for rejected withdrawal: ${adminNotes || 'Contact support'}`,
                        referenceId: String(withdrawalId),
                        referenceType: 'WITHDRAWAL_REFUND'
                    }
                });
            } else if (status === 'PROCESSED') {
                // If PROCESSED, increment the wallet's totalWithdrawn tracker
                await tx.wallet.update({
                    where: { id: withdrawal.walletId },
                    data: {
                        totalWithdrawn: { increment: withdrawal.amount }
                    }
                });
            }

            return updatedWithdrawal;
        });

        return NextResponse.json({
            message: `Withdrawal successfully marked as ${status}`,
            data: result
        });
    } catch (error) {
        console.error('Failed to process withdrawal:', error);

        if (error.message === 'NOT_FOUND') {
            return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
        }
        if (error.message === 'INVALID_STATE') {
            return NextResponse.json({ error: 'Withdrawal request has already been finalized' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
