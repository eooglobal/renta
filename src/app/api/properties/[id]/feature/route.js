import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { initializePayment, generateReference } from "@/lib/paymentGateway";
import { getSetting } from "@/lib/settings";

// POST /api/properties/[id]/feature
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Unauthorized: Only landlords can promote listings." },
        { status: 403 },
      );
    }

    const { id } = params;
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const lId = parseInt(session.user.id);
    if (isNaN(lId) || property.landlordId !== lId) {
      return NextResponse.json(
        { error: "You do not own this property" },
        { status: 403 },
      );
    }

    if (property.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Only verified properties can be featured." },
        { status: 400 },
      );
    }

    const featurePrice = Number((await getSetting("PROMOTION_PRICE")) || 5000);
    const featureDurationDays = Number(
      (await getSetting("PROMOTION_DURATION_DAYS")) || 7,
    );
    const reference = generateReference("FEAT");
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      request.nextUrl.origin;

    const paymentInit = await initializePayment({
      email: session.user.email,
      amount: featurePrice,
      reference,
      metadata: {
        propertyId: property.id,
        landlordId: parseInt(session.user.id),
        type: "FEATURE_LISTING",
        featureDurationDays,
        featurePrice,
      },
      callbackUrl: `${appUrl}/landlord?promoted=true`,
    });

    const paymentUrl =
      paymentInit?.paymentUrl ||
      paymentInit?.authorization_url ||
      paymentInit?.checkoutLink;

    if (!paymentUrl) {
      console.error("Payment initialization failed:", paymentInit);
      return NextResponse.json(
        { error: "Failed to initialize payment gateway" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Payment initialized",
      authorization_url: paymentUrl,
      paymentUrl,
      reference: paymentInit.reference || reference,
      amount: featurePrice,
      durationDays: featureDurationDays,
    });
  } catch (error) {
    console.error("Feature Property error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
