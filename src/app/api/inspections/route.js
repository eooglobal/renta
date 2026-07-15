import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dispatchNotification } from "@/lib/notificationDispatcher";

const OPEN_REQUEST_STATUSES = ["REQUESTED", "CONTACTED", "SCHEDULED"];

function parseTenantId(session) {
  return parseInt(session?.user?.id, 10);
}

// GET: Fetch the current tenant's inspection requests for a property.
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 },
      );
    }

    const requests = await prisma.inspectionRequest.findMany({
      where: {
        propertyId,
        tenantId: parseTenantId(session),
      },
      orderBy: { createdAt: "desc" },
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

// POST: Tenant requests a Renta-managed inspection.
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only tenants can request inspections" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { propertyId, tenantPhone, preferredDate, preferredTimeWindow } = body;

    if (!propertyId || !tenantPhone || !preferredDate || !preferredTimeWindow) {
      return NextResponse.json(
        { error: "propertyId, tenantPhone, preferredDate, and preferredTimeWindow are required" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(preferredDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid preferred inspection date" },
        { status: 400 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const preferredDay = new Date(parsedDate);
    preferredDay.setHours(0, 0, 0, 0);
    if (preferredDay < today) {
      return NextResponse.json(
        { error: "Preferred inspection date must be today or later" },
        { status: 400 },
      );
    }

    const tenantId = parseTenantId(session);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, status: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingRequest = await prisma.inspectionRequest.findFirst({
      where: {
        propertyId,
        tenantId,
        status: { in: OPEN_REQUEST_STATUSES },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have an open inspection request for this property" },
        { status: 409 },
      );
    }

    const inspectionRequest = await prisma.inspectionRequest.create({
      data: {
        propertyId,
        tenantId,
        tenantPhone: tenantPhone.trim(),
        preferredDate: parsedDate,
        preferredTimeWindow: preferredTimeWindow.trim(),
        status: "REQUESTED",
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    await Promise.all(admins.map((admin) =>
      dispatchNotification({
        userId: admin.id,
        type: "INSPECTION",
        title: "New Inspection Request",
        message: `A tenant requested an inspection for "${property.title}".`,
        link: "/admin/inspections",
        sms: null,
      })
    ));

    await dispatchNotification({
      user: { id: tenantId, phone: tenantPhone.trim() || session.user.phone },
      type: "INSPECTION",
      title: "Inspection Request Received",
      message: `Your inspection request for "${property.title}" has been received. Renta staff will contact you to confirm the visit.`,
      link: "/tenant/rentals",
      sms: {
        eventKey: "SMS_INSPECTION_REQUEST_ENABLED",
        message: `Renta: we received your inspection request for ${property.title}. Our staff will contact you to confirm the visit.`,
      },
    });

    return NextResponse.json(
      {
        message: "Inspection request received. Renta staff will contact you to confirm the visit.",
        request: inspectionRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating inspection request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}