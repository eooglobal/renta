import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/tenant/rentals/[id]/receipt
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rentalId = parseInt(params.id);

        const rental = await prisma.rental.findFirst({
            where: {
                id: rentalId,
                tenantId: parseInt(session.user.id),
            },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true,
                        landlord: { select: { firstName: true, lastName: true } },
                    }
                },
                tenant: { select: { firstName: true, lastName: true } },
                payment: { select: { paystackRef: true, nombaRef: true } },
            }
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        const { default: jsPDF } = await import('jspdf');
        const { default: autotable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        const primaryColor = '#FDA829';
        const black = '#000000';
        const paymentRef = rental.payment?.paystackRef || rental.payment?.nombaRef || `RNT-${rental.id}`;
        const tenantName = `${rental.tenant.firstName} ${rental.tenant.lastName}`;
        const landlordName = `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`;

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(primaryColor);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('RENTA', 20, 25);
        doc.setTextColor('#FFFFFF');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('VERIFIED APARTMENT RENTALS', 20, 32);
        doc.setFontSize(18);
        doc.text('PAYMENT RECEIPT', 140, 25);

        // Info section
        doc.setTextColor(black);
        doc.setFontSize(10);
        doc.text('RECEIPT TO:', 20, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(tenantName.toUpperCase(), 20, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('DATE:', 140, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(rental.createdAt).toLocaleDateString('en-GB'), 140, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('RECEIPT NO:', 140, 68);
        doc.setFont('helvetica', 'bold');
        doc.text(`#REC-${rental.id}-${paymentRef.slice(-4)}`, 140, 73);

        // Property details
        doc.setDrawColor(230, 230, 230);
        doc.line(20, 80, 190, 80);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPERTY DETAILS:', 20, 90);
        doc.setFont('helvetica', 'bold');
        doc.text(rental.property.title, 20, 95);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(rental.property.address || '', 20, 100);

        // Items table
        autotable(doc, {
            startY: 110,
            head: [['Description', 'Rate', 'Total']],
            body: [
                [
                    `Rental Payment — ${rental.property.title}`,
                    `₦${Number(rental.rentAmount).toLocaleString()}`,
                    `₦${Number(rental.rentAmount).toLocaleString()}`,
                ],
                [
                    'Platform Service Fee (10%)',
                    `₦${Number(rental.serviceFee).toLocaleString()}`,
                    `₦${Number(rental.serviceFee).toLocaleString()}`,
                ],
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 20, right: 20 },
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(black);
        doc.text('TOTAL PAID:', 140, finalY);
        doc.setTextColor(primaryColor);
        doc.setFontSize(16);
        doc.text(`₦${Number(rental.totalPaid).toLocaleString()}`, 140, finalY + 8);

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Thank you for choosing Renta. This is an electronically generated receipt.', 105, 275, { align: 'center' });
        doc.text('Funds are held in escrow and released upon successful move-in confirmation.', 105, 280, { align: 'center' });
        doc.text(`Landlord: ${landlordName} | Ref: ${paymentRef}`, 105, 285, { align: 'center' });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Renta_Receipt_${rental.id}.pdf"`,
                'Content-Length': pdfBuffer.length,
            },
        });

    } catch (error) {
        console.error('[Receipt API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
    }
}
