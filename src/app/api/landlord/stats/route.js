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

    const activeRentalFilter = {
      property: { landlordId },
      status: { in: ["ACTIVE", "PENDING", "CONFIRMED"] },
    };

    const [totalProperties, pendingVerification, activeTenants, monthlyIncome] =
      await Promise.all([
        prisma.property.count({ where: { landlordId } }),
        prisma.property.count({
          where: { landlordId, verificationStatus: { not: "VERIFIED" } },
        }),
        prisma.rental.count({ where: activeRentalFilter }),
        prisma.rental.aggregate({
          where: activeRentalFilter,
          _sum: { amount: true },
        }),
      ]);

    return NextResponse.json({
      totalProperties,
      activeTenants,
      monthlyIncome: monthlyIncome._sum.amount || 0,
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
