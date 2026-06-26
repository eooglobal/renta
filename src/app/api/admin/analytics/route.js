import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(sixMonthsAgo);
      date.setMonth(sixMonthsAgo.getMonth() + index);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        name: date.toLocaleString("default", { month: "short" }),
      };
    });

    const [rentals, users, properties] = await Promise.all([
      prisma.rental.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          status: { in: ["PENDING", "ACTIVE", "COMPLETED"] },
        },
        select: { totalPaid: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { role: true, createdAt: true },
      }),
      prisma.property.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const revenueByMonth = Object.fromEntries(
      monthKeys.map(({ key, name }) => [key, { name, revenue: 0 }]),
    );

    rentals.forEach((rental) => {
      const key = `${rental.createdAt.getFullYear()}-${String(rental.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (revenueByMonth[key]) {
        revenueByMonth[key].revenue += Number(rental.totalPaid || 0);
      }
    });

    const revenueChartData = monthKeys.map(({ key }) => revenueByMonth[key]);

    const userGrowth = Object.fromEntries(
      monthKeys.map(({ key, name }) => [
        key,
        { name, Tenants: 0, Landlords: 0 },
      ]),
    );

    users.forEach((user) => {
      const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!userGrowth[key]) return;
      if (user.role === "TENANT") userGrowth[key].Tenants += 1;
      if (user.role === "LANDLORD") userGrowth[key].Landlords += 1;
    });

    const userChartData = monthKeys.map(({ key }) => userGrowth[key]);

    const propertyData = properties.map((p) => ({
      name: p.status,
      value: p._count.id,
    }));

    return NextResponse.json({
      revenue: revenueChartData,
      users: userChartData,
      properties: propertyData,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
