import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

// GET: Fetch inspection slots for a property
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 },
      );
    }

    const slots = await prisma.inspectionSlot.findMany({
      where: {
        propertyId: propertyId,
        date: { gte: new Date() }, // Only future slots
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching inspection slots:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST: Book an inspection slot (Tenant)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only tenants can book inspections" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { slotId } = body;

    if (!slotId) {
      return NextResponse.json(
        { error: "slotId is required" },
        { status: 400 },
      );
    }

    // Check slot is available
    const parsedSlotId = parseInt(slotId, 10);
    if (isNaN(parsedSlotId)) {
      return NextResponse.json({ error: "Invalid slotId" }, { status: 400 });
    }

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: parsedSlotId },
      include: { property: true },
    });

    if (!slot || slot.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "This slot is no longer available" },
        { status: 400 },
      );
    }

    const existingBooking = await prisma.inspectionSlot.findFirst({
      where: {
        propertyId: slot.propertyId,
        bookedById: parseInt(session.user.id),
        status: "BOOKED",
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already booked an inspection for this property" },
        { status: 400 },
      );
    }

    const updatedSlot = await prisma.inspectionSlot.update({
      where: { id: parsedSlotId },
      data: {
        status: "BOOKED",
        bookedById: parseInt(session.user.id),
      },
    });

    // Notify landlord
    createNotification(slot.property.landlordId, {
      type: "INSPECTION",
      title: "New Inspection Booked",
      message: `A tenant has booked an inspection for "${slot.property.title}" on ${new Date(slot.date).toLocaleDateString()}.`,
      link: "/landlord/properties",
    });

    return NextResponse.json({
      message: "Inspection booked successfully!",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Error booking inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
