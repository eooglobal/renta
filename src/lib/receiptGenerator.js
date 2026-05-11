import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a professional PDF receipt for a rental payment
 * @param {Object} data - The rental and payment data
 */
export const generateRentalReceipt = (data) => {
    const { 
        tenantName, 
        landlordName, 
        propertyTitle, 
        propertyAddress, 
        rentalId, 
        paymentRef, 
        amount, 
        serviceFee, 
        totalPaid, 
        date 
    } = data;

    const doc = new jsPDF();
    const primaryColor = '#FDA829'; // Renta Orange
    const secondaryColor = '#000000'; // Black

    // --- Header ---
    doc.setFillColor(secondaryColor);
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

    // --- Info Section ---
    doc.setTextColor(secondaryColor);
    doc.setFontSize(10);
    doc.text('RECEIPT TO:', 20, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(tenantName.toUpperCase(), 20, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.text('DATE:', 140, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(date).toLocaleDateString(), 140, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.text('RECEIPT NO:', 140, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(`#REC-${rentalId}-${paymentRef.slice(-4)}`, 140, 73);

    // --- Property Section ---
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 80, 190, 80);
    
    doc.setFont('helvetica', 'normal');
    doc.text('PROPERTY DETAILS:', 20, 90);
    doc.setFont('helvetica', 'bold');
    doc.text(propertyTitle, 20, 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(propertyAddress, 20, 100);

    // --- Table ---
    const tableData = [
        ['Description', 'Rate', 'Total'],
        [`Rental Payment - ${propertyTitle}`, `₦${Number(amount).toLocaleString()}`, `₦${Number(amount).toLocaleString()}`],
        ['Platform Service Fee (10%)', `₦${Number(serviceFee).toLocaleString()}`, `₦${Number(serviceFee).toLocaleString()}`],
    ];

    doc.autoTable({
        startY: 110,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: secondaryColor, textColor: '#FFFFFF' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 20, right: 20 },
    });

    // --- Totals ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAID:', 140, finalY);
    doc.setTextColor(primaryColor);
    doc.setFontSize(16);
    doc.text(`₦${Number(totalPaid).toLocaleString()}`, 140, finalY + 8);

    // --- Footer ---
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Renta. This is an electronically generated receipt.', 105, 280, { align: 'center' });
    doc.text('Funds are held in escrow and will be released upon successful move-in.', 105, 285, { align: 'center' });

    // Save the PDF
    doc.save(`Renta_Receipt_${paymentRef}.pdf`);
};
