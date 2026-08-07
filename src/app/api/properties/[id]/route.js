import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getPriceBreakdown } from "@/lib/commission";
import { generatePropertySlug } from "@/lib/slugs";
import { normalizePropertyImages } from "@/lib/images/normalize";

// GET /api/properties/[id] — Get single property details
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        images: { orderBy: { isPrimary: "desc" } },
        videos: { orderBy: { createdAt: "desc" } },
        landlord: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            ninStatus: true,
            avatar: true,
            createdAt: true,
          },
        },
        inspectionSlots: {
          where: {
            status: "AVAILABLE",
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 10,
        },
        city: true,
        area: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    // Add price breakdown and parse amenities
    const priceBreakdown = getPriceBreakdown(Number(property.rentPrice));
    let amenities = [];
    try {
      amenities = JSON.parse(property.amenities || "[]");
    } catch (e) {
      console.warn("Failed to parse amenities:", e);
    }

    return NextResponse.json({
      property: {
        ...normalizePropertyImages(property),
        amenities,
        priceBreakdown,
      },
    });
  } catch (error) {
    console.error("Single property error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 },
    );
  }
}

// PUT /api/properties/[id] — Update property (landlord owner only)
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const landlordId = parseInt(session.user.id);

    const property = await prisma.property.findUnique({
      where: { id: id },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    if (property.landlordId !== landlordId) {
      return NextResponse.json(
        { error: "You can only edit your own properties" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      rentPrice,
      type,
      address,
      cityId,
      areaId,
      otherAreaName,
      nearestBusStop,
      amenities,
      studentFriendly,
    } = body;

    // Handle "other" area creation/assignment
    let finalAreaId = areaId ? parseInt(areaId) : property.areaId;
    if (cityId && otherAreaName && otherAreaName.trim()) {
      const parsedCityId = parseInt(cityId);
      const existing = await prisma.area.findFirst({
        where: {
          cityId: parsedCityId,
          name: { equals: otherAreaName.trim() },
        },
      });
      if (existing) {
        finalAreaId = existing.id;
      } else {
        const createdArea = await prisma.area.create({
          data: {
            name: otherAreaName.trim(),
            cityId: parsedCityId,
          },
        });
        finalAreaId = createdArea.id;
      }
    }

    const updateData = {};
    if (title && title !== property.title) {
      updateData.title = title;
      updateData.slug = await generatePropertySlug(
        title,
        cityId ? parseInt(cityId) : property.cityId,
      );
    }
    if (description !== undefined) updateData.description = description;
    if (rentPrice !== undefined)
      updateData.rentPrice = parseFloat(rentPrice);
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (cityId !== undefined) updateData.cityId = parseInt(cityId);
    if (finalAreaId) updateData.areaId = finalAreaId;
    if (nearestBusStop !== undefined)
      updateData.nearestBusStop = nearestBusStop;
    if (amenities !== undefined)
      updateData.amenities = JSON.stringify(
        Array.isArray(amenities) ? amenities : [],
      );
    if (studentFriendly !== undefined)
      updateData.studentFriendly = Boolean(studentFriendly);

    // Re-verify if title, rent, address, or location changed
    if (title || rentPrice || address || cityId || finalAreaId) {
      updateData.status = "PENDING";
      updateData.verificationStatus = "UNVERIFIED";
    }

    const updatedProperty = await prisma.property.update({
      where: { id: id },
      data: updateData,
      include: {
        images: true,
        videos: true,
        city: true,
        area: true,
      },
    });

    return NextResponse.json({
      property: normalizePropertyImages(updatedProperty),
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Property update error:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}

// DELETE /api/properties/[id] — Delete property (landlord owner or admin)
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id: id },
      include: { rentals: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const isOwner = property.landlordId === parseInt(session.user.id);
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const activeRentals = property.rentals.filter((r) => r.status === "ACTIVE");
    if (activeRentals.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete property with active rentals" },
        { status: 400 },
      );
    }

    // Fetch all media to delete them physically
    const [images, videos] = await Promise.all([
      prisma.propertyImage.findMany({ where: { propertyId: id } }),
      prisma.propertyVideo.findMany({ where: { propertyId: id } }),
    ]);

    const { deleteFileByUrl } = await import("@/lib/fileCleanup");

    // Non-blocking media file cleanup
    Promise.all([...images, ...videos].map((media) => deleteFileByUrl(media.url))).catch((err) => {
      console.error("Failed to cleanup property media:", err);
    });

    // Delete dependent records first to fulfill foreign key constraints
    const rentalIds = property.rentals.map((r) => r.id);
    if (rentalIds.length > 0) {
      await prisma.escrow.deleteMany({ where: { rentalId: { in: rentalIds } } });
      await prisma.rentalAgreement.deleteMany({ where: { rentalId: { in: rentalIds } } });
      await prisma.maintenanceRequest.deleteMany({ where: { rentalId: { in: rentalIds } } });
      await prisma.commission.deleteMany({ where: { rentalId: { in: rentalIds } } });
      await prisma.payment.deleteMany({ where: { rentalId: { in: rentalIds } } });
      await prisma.rental.deleteMany({ where: { id: { in: rentalIds } } });
    }

    await prisma.inspectionRequest.deleteMany({ where: { propertyId: id } });
    await prisma.inspectionSlot.deleteMany({ where: { propertyId: id } });
    await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
    await prisma.propertyVideo.deleteMany({ where: { propertyId: id } });

    // Finally delete the property record
    await prisma.property.delete({ where: { id: id } });

    return NextResponse.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Property delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 },
    );
  }
}
