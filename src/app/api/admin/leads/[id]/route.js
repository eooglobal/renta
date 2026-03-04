import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        // Only Super Admin and Verification Officer can manage leads
        const adminRole = session.user.adminRole;
        if (adminRole === 'SUPPORT') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const leadId = parseInt(params.id);
        const body = await request.json();
        const { status } = body;

        const validStatuses = ['SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const lead = await prisma.scoutLead.findUnique({
            where: { id: leadId }
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const updatedLead = await prisma.scoutLead.update({
            where: { id: leadId },
            data: { status }
        });

        return NextResponse.json({
            message: `Lead status updated to ${status}`,
            data: updatedLead
        });
    } catch (error) {
        console.error('Failed to update lead status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
