import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  createTransactionSplit,
  generateReference,
  getActiveGateway,
  initializeSplitPayment,
} from "@/lib/paymentGateway";
import { calculateRentalDistribution } from "@/lib/commission";

function toPaystackShare(amount, totalPayable) {
  return Number(((Number(amount) / Number(totalPayable)) * 100).toFixed(2));
}

function buildAffiliateReferralContext(tenant) {
  if (!tenant?.referredById) return null;

  return {
    affiliateId: tenant.referredById,
    affiliate: tenant.referredBy || null,
  };
}

function getReadySplitSubaccounts(distribution) {
  return distribution.recipients
    .filter((recipient) => recipient.subaccountCode && recipient.settlementMode === "PAYSTACK_SPLIT")
    .map((recipient) => ({
      subaccount: recipient.subaccountCode,
      share: toPaystackShare(recipient.amount, distribution.totalPayable),
    }));
}

// POST /api/payments/initialize - Start a rental payment
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only tenants can make payments" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID required" },
        { status: 400 },
      );
    }

    const gateway = await getActiveGateway();
    if (gateway !== "paystack") {
      return NextResponse.json(
        { error: "Direct split rental payments require Paystack" },
        { status: 400 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        landlord: true,
        scoutLead: {
          include: { scout: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    if (property.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Property is not available for rent" },
        { status: 400 },
      );
    }

    const existingRental = await prisma.rental.findFirst({
      where: { propertyId, status: "ACTIVE" },
    });

    if (existingRental) {
      return NextResponse.json(
        { error: "This property is already rented" },
        { status: 400 },
      );
    }

    const tenant = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id, 10) },
      include: {
        referredBy: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const affiliateReferral = buildAffiliateReferralContext(tenant);
    const distribution = calculateRentalDistribution(Number(property.rentPrice), {
      landlord: property.landlord,
      scoutLead: property.scoutLead,
      affiliateReferral,
    });

    const landlordRecipient = distribution.recipients.find((recipient) => recipient.type === "LANDLORD");
    if (!landlordRecipient?.subaccountCode) {
      return NextResponse.json(
        { error: "Landlord payout setup is required before rent payment can start" },
        { status: 409 },
      );
    }

    const splitSubaccounts = getReadySplitSubaccounts(distribution);
    if (splitSubaccounts.length === 0) {
      return NextResponse.json(
        { error: "No Paystack payout destination is available for this rental" },
        { status: 409 },
      );
    }

    const reference = generateReference();
    const split = await createTransactionSplit({
      name: `Renta rental ${property.id} ${reference}`,
      type: "percentage",
      currency: "NGN",
      bearerType: "account",
      subaccounts: splitSubaccounts,
    });

    const splitCode = split.split_code || split.splitCode;
    const splitId = split.id || null;

    if (!splitCode) {
      return NextResponse.json(
        { error: "Paystack did not return a split code" },
        { status: 502 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      request.nextUrl.origin;

    let rental;
    let paymentInit;

    try {
      rental = await prisma.rental.create({
        data: {
          tenantId: parseInt(session.user.id, 10),
          propertyId: property.id,
          rentAmount: distribution.rentAmount,
          serviceFee: distribution.serviceFee,
          totalPaid: distribution.totalPayable,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "PENDING",
          paymentMode: "DIRECT_SPLIT",
          splitCode,
          splitId,
          landlordPayoutAmount: distribution.landlordPayout,
          platformRevenueAmount: distribution.platformRevenue + distribution.pendingSetupAmount,
          scoutCommissionAmount: distribution.scoutCommission,
          affiliateCommissionAmount: distribution.affiliateCommission,
          scoutId: distribution.recipients.find((recipient) => recipient.type === "SCOUT")?.userId || null,
          affiliateId: distribution.recipients.find((recipient) => recipient.type === "AFFILIATE")?.userId || null,
          affiliateReferralId: null,
          paystackRef: reference,
        },
      });

      await prisma.payment.create({
        data: {
          rentalId: rental.id,
          amount: distribution.totalPayable,
          paystackRef: reference,
          nombaRef: null,
          status: "PENDING",
          gateway: "PAYSTACK",
          splitPayload: {
            splitCode,
            splitId,
            subaccounts: splitSubaccounts,
            distribution,
          },
        },
      });

      paymentInit = await initializeSplitPayment({
        email: tenant.email,
        amount: distribution.totalPayable,
        reference,
        splitCode,
        callbackUrl: `${appUrl}/tenant/payments/verify?reference=${reference}`,
        metadata: {
          rentalId: rental.id,
          propertyId: property.id,
          tenantId: session.user.id,
          paymentMode: "DIRECT_SPLIT",
          custom_fields: [
            {
              display_name: "Property",
              variable_name: "property",
              value: property.title,
            },
            {
              display_name: "Landlord",
              variable_name: "landlord",
              value: `${property.landlord.firstName} ${property.landlord.lastName}`,
            },
          ],
        },
      });
    } catch (paymentError) {
      if (rental?.id) {
        await prisma.rental
          .delete({ where: { id: rental.id } })
          .catch(() => null);
      }
      throw paymentError;
    }

    const paymentUrl =
      paymentInit.paymentUrl ||
      paymentInit.authorization_url ||
      paymentInit.checkoutLink;

    return NextResponse.json({
      message: "Payment initialized",
      paymentUrl,
      reference:
        paymentInit.reference || paymentInit.orderReference || reference,
      rental,
      distribution,
    });
  } catch (error) {
    console.error("Payment initialize error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 },
    );
  }
}