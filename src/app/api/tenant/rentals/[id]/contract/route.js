import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/tenant/rentals/[id]/contract
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
                agreement: true,
            }
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        if (!rental.agreement?.tenantSigned) {
            return NextResponse.json({ error: 'Agreement has not been signed yet' }, { status: 400 });
        }

        const { default: jsPDF } = await import('jspdf');
        const { default: autotable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        const primaryColor = '#FDA829';
        const black = '#000000';
        const pageWidth = 210;
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        const tenantName = `${rental.tenant.firstName} ${rental.tenant.lastName}`;
        const landlordName = `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`;
        const typedName = rental.agreement?.tenantSignature || tenantName;
        const signedAt = rental.agreement?.tenantSignedAt || rental.updatedAt;

        const fmtDate = (d) => {
            if (!d) return 'N/A';
            return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };
        const fmtCurrency = (v) => '₦' + Number(v).toLocaleString('en-NG');

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 42, 'F');
        doc.setTextColor(primaryColor);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text('RENTA', margin, 20);
        doc.setTextColor('#FFFFFF');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('VERIFIED APARTMENT RENTALS', margin, 28);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RESIDENTIAL TENANCY AGREEMENT', margin, 37);

        let y = 56;
        doc.setTextColor(black);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rental Agreement #${rental.id}`, margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#7a7a7a');
        doc.text(`Property: ${rental.property?.title || 'N/A'}`, margin, y);
        y += 6;
        doc.text(`Address: ${rental.property?.address || 'N/A'}`, margin, y);
        y += 12;

        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Parties
        doc.setTextColor(black);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('1. PARTIES', margin, y);
        y += 7;
        doc.setFontSize(9);
        for (const [label, val] of [
            ['Tenant:', tenantName],
            ['Landlord:', landlordName],
            ['Property Address:', rental.property?.address || 'N/A'],
        ]) {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(val, margin + 35, y);
            y += 6;
        }
        y += 4;

        // Rental Period
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('2. RENTAL PERIOD', margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`From ${fmtDate(rental.startDate)} to ${fmtDate(rental.endDate)}`, margin, y);
        y += 10;

        // Rent & Fees
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('3. RENT AND FEES', margin, y);
        y += 7;
        doc.setFontSize(9);
        for (const [label, val] of [
            ['Rent Amount:', fmtCurrency(rental.rentAmount)],
            ['Platform Service Fee:', fmtCurrency(rental.serviceFee)],
            ['Total Amount Paid:', fmtCurrency(rental.totalPaid)],
        ]) {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(val, margin + 50, y);
            y += 6;
        }
        y += 4;

        // Clauses
        const clauses = [
            ['4. ESCROW TERMS', 'All rental funds are held securely in escrow by Renta. Funds are released to the Landlord only after the Tenant confirms access. In disputes, funds remain held until resolved.'],
            ['5. TENANT OBLIGATIONS', 'Maintain property condition, no subletting without consent, no unlawful use, report damages via Renta.'],
            ['6. LANDLORD OBLIGATIONS', 'Ensure habitable condition, grant peaceful enjoyment, attend to maintenance requests via Renta.'],
            ['7. TERMINATION', 'Either party may terminate with 30 days written notice via Renta. Early termination may result in penalties.'],
            ['8. DISPUTE RESOLUTION', 'Disputes submitted via Renta platform first. If unresolved in 14 days, may proceed to mediation or court.'],
            ['9. ELECTRONIC SIGNATURE', 'Electronic signature is legally binding per Nigerian law.'],
            ['10. GOVERNING LAW', 'Governed by the laws of the Federal Republic of Nigeria.'],
        ];

        for (const [heading, body] of clauses) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(black);
            doc.text(heading, margin, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor('#4a4a4a');
            const lines = doc.splitTextToSize(body, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 6;
        }

        // Signature block
        if (y > 230) { doc.addPage(); y = 20; }
        y += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        doc.setTextColor(black);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TENANT SIGNATURE', margin, y);
        y += 8;

        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(14);
        doc.setTextColor('#2a2a2a');
        doc.text(typedName, margin + 6, y + 12);
        y += 24;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#7a7a7a');
        doc.text(`Signed electronically on: ${fmtDate(signedAt)}`, margin, y);
        y += 6;
        doc.text(`Tenant Name: ${typedName}`, margin, y);
        y += 6;
        doc.text(`Rental Reference: #${rental.id}`, margin, y);

        // Page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(180, 180, 180);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('This is an electronically generated document facilitated by Renta.', margin, 287, { maxWidth: contentWidth });
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: 'right' });
        }

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Renta_Agreement_${rental.id}.pdf"`,
                'Content-Length': pdfBuffer.length,
            },
        });

    } catch (error) {
        console.error('[Contract API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
    }
}
