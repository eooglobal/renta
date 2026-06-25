import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

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
                    },
                },
                tenant: { select: { firstName: true, lastName: true } },
                payment: { select: { paystackRef: true, nombaRef: true } },
            },
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        const PDFDocument = (await import('pdfkit')).default;

        const paymentRef = rental.payment?.paystackRef || rental.payment?.nombaRef || `RNT-${rental.id}`;
        const tenantName = `${rental.tenant.firstName} ${rental.tenant.lastName}`;
        const landlordName = `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`;
        const fmtAmount = (v) => 'NGN ' + Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        await new Promise((resolve) => {
            doc.on('end', resolve);

            // ── Header bar ──
            doc.rect(0, 0, doc.page.width, 80).fill('#000000');
            doc.fillColor('#FDA829').fontSize(28).font('Helvetica-Bold').text('RENTA', 50, 22);
            doc.fillColor('#AAAAAA').fontSize(9).font('Helvetica').text('VERIFIED APARTMENT RENTALS', 50, 54);
            doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('PAYMENT RECEIPT', 0, 35, { align: 'right', width: doc.page.width - 50 });

            // ── Receipt meta ──
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('RECEIPT TO:', 50, 105);
            doc.font('Helvetica').fontSize(12).text(tenantName.toUpperCase(), 50, 120);

            doc.font('Helvetica-Bold').fontSize(10).text('DATE:', 350, 105);
            doc.font('Helvetica').fontSize(10).text(fmtDate(rental.createdAt), 350, 120);

            doc.font('Helvetica-Bold').fontSize(10).text('RECEIPT NO:', 350, 138);
            doc.font('Helvetica').fontSize(10).text(`#REC-${rental.id}-${paymentRef.slice(-4)}`, 350, 153);

            // ── Divider ──
            doc.moveTo(50, 175).lineTo(doc.page.width - 50, 175).strokeColor('#DDDDDD').lineWidth(1).stroke();

            // ── Property details ──
            doc.fillColor('#888888').fontSize(9).font('Helvetica').text('PROPERTY DETAILS', 50, 190);
            doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(rental.property.title, 50, 206);
            doc.fillColor('#666666').fontSize(9).font('Helvetica').text(rental.property.address || '', 50, 222);

            // ── Table header ──
            const tableTop = 255;
            doc.rect(50, tableTop, doc.page.width - 100, 24).fill('#000000');
            doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
            doc.text('DESCRIPTION', 60, tableTop + 7);
            doc.text('RATE', 340, tableTop + 7);
            doc.text('TOTAL', 450, tableTop + 7);

            // Row 1
            doc.rect(50, tableTop + 24, doc.page.width - 100, 24).fill('#F9F9F9');
            doc.fillColor('#000000').fontSize(10).font('Helvetica');
            doc.text(`Rental — ${rental.property.title}`, 60, tableTop + 31, { width: 270 });
            doc.text(fmtAmount(rental.rentAmount), 340, tableTop + 31);
            doc.text(fmtAmount(rental.rentAmount), 450, tableTop + 31);

            // Row 2
            doc.rect(50, tableTop + 48, doc.page.width - 100, 24).fill('#FFFFFF');
            doc.fillColor('#000000').fontSize(10).font('Helvetica');
            doc.text('Platform Service Fee (10%)', 60, tableTop + 55);
            doc.text(fmtAmount(rental.serviceFee), 340, tableTop + 55);
            doc.text(fmtAmount(rental.serviceFee), 450, tableTop + 55);

            // ── Totals ──
            const totalY = tableTop + 95;
            doc.moveTo(50, totalY - 10).lineTo(doc.page.width - 50, totalY - 10).strokeColor('#DDDDDD').lineWidth(1).stroke();
            doc.fillColor('#888888').fontSize(10).font('Helvetica-Bold').text('TOTAL PAID:', 340, totalY);
            doc.fillColor('#FDA829').fontSize(20).font('Helvetica-Bold').text(fmtAmount(rental.totalPaid), 340, totalY + 16);

            // ── Landlord info ──
            doc.fillColor('#999999').fontSize(8).font('Helvetica').text(`Landlord: ${landlordName}   |   Payment Ref: ${paymentRef}`, 50, totalY + 50, { align: 'center', width: doc.page.width - 100 });

            // ── Footer ──
            const footerY = doc.page.height - 80;
            doc.rect(0, footerY, doc.page.width, 80).fill('#111111');
            doc.fillColor('#888888').fontSize(8).font('Helvetica-Oblique')
                .text('Thank you for choosing Renta. This is an electronically generated receipt.', 50, footerY + 18, { align: 'center', width: doc.page.width - 100 })
                .text('Funds are held in escrow and released upon successful move-in confirmation.', 50, footerY + 32, { align: 'center', width: doc.page.width - 100 });

            doc.end();
        });

        const pdfBuffer = Buffer.concat(chunks);

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Renta_Receipt_${rental.id}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });

    } catch (error) {
        console.error('[Receipt API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate receipt', detail: error.message }, { status: 500 });
    }
}
