import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { normalizePropertyImages } from "@/lib/images/normalize";
import { getSetting } from "@/lib/settings";

// GET /api/landlord/properties — Authenticated landlord property list
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const landlordId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where = { landlordId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [properties, total, promotionPrice] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          area: { select: { id: true, name: true } },
          city: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
      getSetting("PROMOTION_PRICE").then((v) => Number(v || 5000)),
    ]);

    return NextResponse.json({
      properties: properties.map(normalizePropertyImages),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      promotionSettings: { promotionPrice },
    });
  } catch (error) {
    console.error("Landlord properties error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
