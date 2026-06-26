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

    const tenantStatsFilter = {
      property: { landlordId },
      status: { in: ["PENDING", "ACTIVE", "COMPLETED", "DISPUTED"] },
    };

    const incomeFilter = {
      property: { landlordId },
      status: { in: ["PENDING", "ACTIVE"] },
    };

    const [totalProperties, pendingVerification, activeTenants, monthlyIncome] =
      await Promise.all([
        prisma.property.count({ where: { landlordId } }),
        prisma.property.count({
          where: {
            landlordId,
            status: { not: "VERIFIED" },
          },
        }),
        prisma.rental.count({ where: tenantStatsFilter }),
        prisma.rental.aggregate({
          where: incomeFilter,
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
