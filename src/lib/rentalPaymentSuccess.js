function parsePaidAt(paymentData) {
  return paymentData?.paid_at ? new Date(paymentData.paid_at) : new Date();
}

function getGatewayPayload(paymentData) {
  return paymentData?.gatewayPayload || paymentData || null;
}

function getCommissionRecipients(payment) {
  const recipients = payment?.splitPayload?.distribution?.recipients || [];
  return recipients.filter((recipient) =>
    ["SCOUT", "AFFILIATE"].includes(recipient.type) && recipient.userId && Number(recipient.amount) > 0,
  );
}

function statusForSettlementMode(settlementMode) {
  return settlementMode === "PENDING_SETUP" ? "PENDING_SETUP" : "PAID";
}

function paidAtForSettlementMode(settlementMode, paidAt) {
  return settlementMode === "PENDING_SETUP" ? null : paidAt;
}

export async function applyRentalPaymentSuccess(tx, { payment, paymentData = {} }) {
  const paidAt = parsePaidAt(paymentData);

  await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      paidAt,
      gatewayPayload: getGatewayPayload(paymentData),
    },
  });

  await tx.rental.update({
    where: { id: payment.rentalId },
    data: { status: "ACTIVE" },
  });

  await tx.property.update({
    where: { id: payment.rental.propertyId },
    data: { status: "RENTED" },
  });

  if (payment.rental.paymentMode !== "DIRECT_SPLIT") {
    if (payment.rental.escrow) {
      await tx.escrow.update({
        where: { id: payment.rental.escrow.id },
        data: { status: "HELD" },
      });
    }
    return;
  }

  for (const recipient of getCommissionRecipients(payment)) {
    const settlementMode = recipient.settlementMode || "PAYSTACK_SPLIT";
    await tx.commission.create({
      data: {
        rentalId: payment.rentalId,
        userId: recipient.userId,
        type: recipient.type,
        amount: Number(recipient.amount),
        percentage: Number(recipient.percentageOfTotal || 0),
        status: statusForSettlementMode(settlementMode),
        settlementMode,
        paystackSubaccountCode: recipient.subaccountCode || null,
        paidAt: paidAtForSettlementMode(settlementMode, paidAt),
      },
    });
  }
}