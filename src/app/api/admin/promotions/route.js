import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { normalizePropertyImages } from "@/lib/images/normalize";

// GET /api/admin/promotions — List all featured or potentially featured properties
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { isFeatured: true },
          { status: "VERIFIED" }, // Show verified properties as candidates for promotion
        ],
      },
      include: {
        landlord: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    const promotionPrice = Number(
      (await getSetting("PROMOTION_PRICE")) || 5000,
    );
    const promotionDurationDays = Number(
      (await getSetting("PROMOTION_DURATION_DAYS")) || 7,
    );

    return NextResponse.json({
      properties: properties.map(normalizePropertyImages),
      settings: {
        promotionPrice,
        promotionDurationDays,
      },
    });
  } catch (error) {
    console.error("Admin promotions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/promotions — Manually feature/unfeature a property
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, isFeatured, days } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    const defaultDurationDays = Number(
      (await getSetting("PROMOTION_DURATION_DAYS")) || 7,
    );
    const featuredUntil = isFeatured ? new Date() : null;
    if (isFeatured) {
      featuredUntil.setDate(
        featuredUntil.getDate() + parseInt(days || defaultDurationDays),
      );
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        isFeatured,
        featuredUntil,
      },
    });

    return NextResponse.json({
      message: `Property ${isFeatured ? "featured" : "unfeatured"} successfully`,
      property: updated,
    });
  } catch (error) {
    console.error("Update promotion error:", error);
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 },
    );
  }
}
