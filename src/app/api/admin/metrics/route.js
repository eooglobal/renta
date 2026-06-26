import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      activeListings,
      pendingProperties,
      escrows,
      commissions,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: "VERIFIED" } }),
      prisma.property.count({
        where: {
          status: "PENDING",
          verificationStatus: {
            in: ["UNVERIFIED", "IN_PROGRESS", "SUSPICIOUS"],
          },
        },
      }),
      prisma.escrow.findMany({
        where: { status: "HELD" },
        select: { amount: true },
      }),
      prisma.commission.findMany({
        where: { type: "PLATFORM" },
        select: { amount: true },
      }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    ]);

    const escrowHeld = escrows.reduce((sum, e) => sum + Number(e.amount), 0);
    const platformRevenue = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeListings,
        escrowHeld,
        platformRevenue,
        pendingProperties,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin metrics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
