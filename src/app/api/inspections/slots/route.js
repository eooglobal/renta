import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST: Landlord creates inspection slots for their property
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, date, startTime, endTime } = body;

    if (!propertyId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const slotDate = new Date(date);
    if (Number.isNaN(slotDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid inspection date" },
        { status: 400 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      return NextResponse.json(
        { error: "Inspection date must be today or later" },
        { status: 400 },
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Verify landlord owns the property
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: parseInt(session.user.id) },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const existingSlot = await prisma.inspectionSlot.findFirst({
      where: {
        propertyId: property.id,
        date: slotDate,
        startTime,
        endTime,
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "This inspection slot already exists" },
        { status: 409 },
      );
    }

    const slot = await prisma.inspectionSlot.create({
      data: {
        propertyId: property.id,
        date: slotDate,
        startTime,
        endTime,
      },
    });

    return NextResponse.json(
      { message: "Inspection slot created", slot },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating inspection slot:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
