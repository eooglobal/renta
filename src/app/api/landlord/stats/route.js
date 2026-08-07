import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const landlordId = parseInt(session.user.id);

    // Only ACTIVE rentals = a tenant who completed payment and is living there
    const activeRentalFilter = {
      property: { landlordId },
      status: "ACTIVE",
    };

    const [totalProperties, pendingVerification, activeTenants, monthlyIncome] =
      await Promise.all([
        // Count only properties that are visible/live on the platform
        prisma.property.count({
          where: {
            landlordId,
            status: { in: ["PENDING", "VERIFIED", "RENTED"] },
          },
        }),
        // Pending verification = properties not yet reviewed by admin
        prisma.property.count({
          where: {
            landlordId,
            status: "PENDING",
          },
        }),
        // Active tenants = unique rentals where payment is confirmed (ACTIVE only)
        prisma.rental.count({ where: activeRentalFilter }),
        // Monthly income = sum of rent from ACTIVE tenants only (real confirmed payments)
        prisma.rental.aggregate({
          where: activeRentalFilter,
          _sum: { rentAmount: true },
        }),
      ]);

    return NextResponse.json({
      totalProperties,
      activeTenants,
      monthlyIncome: Number(monthlyIncome._sum.rentAmount || 0),
      pendingVerification,
    });
  } catch (error) {
    console.error("Landlord stats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
