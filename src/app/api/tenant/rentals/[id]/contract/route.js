import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/tenant/rentals/[id]/contract
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const rentalId = parseInt(id);

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
                agreement: true,
            },
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        if (!rental.agreement?.tenantSigned) {
            return NextResponse.json({ error: 'Agreement has not been signed yet' }, { status: 400 });
        }

        const PDFDocument = (await import('pdfkit')).default;

        const tenantName = `${rental.tenant.firstName} ${rental.tenant.lastName}`;
        const landlordName = `${rental.property.landlord.firstName} ${rental.property.landlord.lastName}`;
        const typedName = rental.agreement?.tenantSignature || tenantName;
        const signedAt = rental.agreement?.tenantSignedAt || rental.updatedAt;

        const fmtDate = (d) => {
            if (!d) return 'N/A';
            return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };
        const fmtAmount = (v) => 'NGN ' + Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        await new Promise((resolve) => {
            doc.on('end', resolve);

            const pageW = doc.page.width;
            const margin = 50;
            const contentW = pageW - margin * 2;

            // ── Header ──
            doc.rect(0, 0, pageW, 80).fill('#000000');
            doc.fillColor('#FDA829').fontSize(26).font('Helvetica-Bold').text('RENTA', margin, 18);
            doc.fillColor('#AAAAAA').fontSize(9).font('Helvetica').text('VERIFIED APARTMENT RENTALS', margin, 46);
            doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('RESIDENTIAL TENANCY AGREEMENT', margin, 62);

            // ── Agreement ID ──
            let y = 105;
            doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold').text(`Rental Agreement #${rental.id}`, margin, y);
            y += 18;
            doc.fillColor('#777777').fontSize(9).font('Helvetica').text(`Property: ${rental.property?.title || 'N/A'}`, margin, y);
            y += 13;
            doc.text(`Address: ${rental.property?.address || 'N/A'}`, margin, y);
            y += 18;

            // ── Divider ──
            doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#DDDDDD').lineWidth(1).stroke();
            y += 16;

            // ── Section helper ──
            const section = (title, body) => {
                if (y > 700) { doc.addPage(); y = 50; }
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(title, margin, y);
                y += 14;
                if (Array.isArray(body)) {
                    // Key-value pairs
                    for (const [label, value] of body) {
                        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555555').text(label, margin, y, { continued: true, width: 130 });
                        doc.font('Helvetica').fillColor('#000000').text(value, { width: contentW - 130 });
                        y += 14;
                    }
                } else {
                    doc.font('Helvetica').fontSize(9).fillColor('#444444');
                    const lines = doc.heightOfString(body, { width: contentW });
                    doc.text(body, margin, y, { width: contentW });
                    y += lines + 8;
                }
                y += 8;
            };

            section('1. PARTIES', [
                ['Tenant:', tenantName],
                ['Landlord:', landlordName],
                ['Property Address:', rental.property?.address || 'N/A'],
            ]);

            section('2. RENTAL PERIOD', [
                ['Start Date:', fmtDate(rental.startDate)],
                ['End Date:', fmtDate(rental.endDate)],
            ]);

            section('3. RENT AND FEES', [
                ['Rent Amount:', fmtAmount(rental.rentAmount)],
                ['Platform Service Fee:', fmtAmount(rental.serviceFee)],
                ['Total Amount Paid:', fmtAmount(rental.totalPaid)],
            ]);

            section('4. ESCROW TERMS', 'All rental funds are held securely in escrow by Renta. Funds are released to the Landlord only after the Tenant confirms access to the property. In the event of a dispute, funds remain held until the matter is resolved by Renta administration.');

            section('5. TENANT OBLIGATIONS', 'Maintain the property in good condition. No subletting without written consent. No unlawful use of the premises. Report damages promptly via the Renta platform.');

            section('6. LANDLORD OBLIGATIONS', 'Ensure the property is in habitable condition at the commencement of the tenancy. Grant the Tenant peaceful enjoyment of the property. Attend to valid maintenance requests submitted via Renta.');

            section('7. TERMINATION', 'Either party may terminate this agreement with 30 days written notice via the Renta platform. Early termination may result in penalties as determined by Renta policy.');

            section('8. DISPUTE RESOLUTION', 'All disputes must first be submitted via the Renta platform. If unresolved within 14 days, parties may proceed to mediation or appropriate court action.');

            section('9. ELECTRONIC SIGNATURE', 'This agreement is electronically signed and is legally binding under the laws of the Federal Republic of Nigeria, including the Cybercrimes (Prohibition, Prevention, Etc.) Act and the Evidence Act.');

            section('10. GOVERNING LAW', 'This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.');

            // ── Signature block ──
            if (y > 650) { doc.addPage(); y = 50; }
            y += 8;
            doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#DDDDDD').lineWidth(1).stroke();
            y += 20;

            doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold').text('TENANT SIGNATURE', margin, y);
            y += 16;

            // Signature box
            doc.rect(margin, y, contentW, 40).fillAndStroke('#F9F9F9', '#CCCCCC');
            doc.fillColor('#2a2a2a').fontSize(16).font('Helvetica-Oblique').text(typedName, margin + 12, y + 12);
            y += 52;

            doc.fillColor('#888888').fontSize(8).font('Helvetica');
            doc.text(`Signed electronically on: ${fmtDate(signedAt)}`, margin, y);
            y += 12;
            doc.text(`Tenant Full Name: ${typedName}`, margin, y);
            y += 12;
            doc.text(`Rental Reference: #${rental.id}`, margin, y);

            // ── Page numbers ──
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fillColor('#BBBBBB').fontSize(8).font('Helvetica-Oblique');
                doc.text('This is an electronically generated document facilitated by Renta.', margin, doc.page.height - 30, { width: contentW - 60 });
                doc.text(`Page ${i + 1} of ${pageCount}`, margin, doc.page.height - 30, { align: 'right', width: contentW });
            }

            doc.end();
        });

        const pdfBuffer = Buffer.concat(chunks);

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Renta_Agreement_${rental.id}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });

    } catch (error) {
        console.error('[Contract API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate contract', detail: error.message }, { status: 500 });
    }
}
