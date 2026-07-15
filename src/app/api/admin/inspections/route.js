import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dispatchNotification } from "@/lib/notificationDispatcher";

const VALID_STATUSES = ["REQUESTED", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"];

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where = status ? { status } : {};

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid inspection status" }, { status: 400 });
    }

    const requests = await prisma.inspectionRequest.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, address: true, landlordId: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        assignedStaff: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching inspection requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status, scheduledAt, assignedStaffId, adminNote } = body;
    const parsedRequestId = parseInt(requestId, 10);

    if (!parsedRequestId || !status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Valid requestId and status are required" },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.inspectionRequest.findUnique({
      where: { id: parsedRequestId },
      include: {
        property: true,
        tenant: { select: { id: true, phone: true } },
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Inspection request not found" }, { status: 404 });
    }

    let parsedScheduledAt = null;
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      if (Number.isNaN(parsedScheduledAt.getTime())) {
        return NextResponse.json({ error: "Invalid scheduledAt value" }, { status: 400 });
      }
    }

    const data = {
      status,
      scheduledAt: parsedScheduledAt,
      assignedStaffId: assignedStaffId ? parseInt(assignedStaffId, 10) : null,
      adminNote: adminNote || null,
    };

    const updatedRequest = await prisma.inspectionRequest.update({
      where: { id: parsedRequestId },
      data,
    });

    if (status === "SCHEDULED") {
      await dispatchNotification({
        user: existingRequest.tenant || { id: existingRequest.tenantId, phone: existingRequest.tenantPhone },
        type: "INSPECTION",
        title: "Inspection Scheduled",
        message: `Your inspection for "${existingRequest.property.title}" has been scheduled by Renta staff.`,
        link: "/tenant/rentals",
        sms: {
          eventKey: "SMS_INSPECTION_SCHEDULED_ENABLED",
          message: `Renta: your inspection for ${existingRequest.property.title} has been scheduled. Please check your dashboard for details.`,
        },
      });
    } else if (["COMPLETED", "CANCELLED"].includes(status)) {
      await dispatchNotification({
        user: existingRequest.tenant || { id: existingRequest.tenantId, phone: existingRequest.tenantPhone },
        type: "INSPECTION",
        title: `Inspection ${status === "COMPLETED" ? "Completed" : "Cancelled"}`,
        message: `Your inspection request for "${existingRequest.property.title}" has been marked ${status.toLowerCase()}.`,
        link: "/tenant/rentals",
        sms: {
          eventKey: "SMS_INSPECTION_SCHEDULED_ENABLED",
          message: `Renta: your inspection request for ${existingRequest.property.title} has been marked ${status.toLowerCase()}.`,
        },
      });
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("Error updating inspection request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}