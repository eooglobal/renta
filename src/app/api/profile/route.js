import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSetting } from "@/lib/settings";

// GET: Fetch current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        ninNumber: true,
        ninStatus: true,
        bankName: true,
        bankAccount: true,
        bankCode: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mask NIN for security (show last 4 digits only)
    if (user.ninNumber) {
      user.ninNumber = "***-***-" + user.ninNumber.slice(-4);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PUT: Update current user's profile
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      bankName,
      bankAccount,
      bankCode,
      accountName,
      currentPassword,
      newPassword,
    } = body;

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- Bank Account Name Verification ---
    let bankVerificationWarning = null;
    if (bankAccount || bankCode || accountName !== undefined) {
      const finalAccount =
        bankAccount !== undefined ? bankAccount : user.bankAccount;
      const finalCode = bankCode !== undefined ? bankCode : user.bankCode;
      const finalAccountName = accountName !== undefined ? accountName : null;
      const activeGateway = await getSetting("ACTIVE_PAYMENT_GATEWAY");
      const nombaBaseUrl =
        (await getSetting("NOMBA_BASE_URL")) || "https://api.nomba.com";
      const isNombaSandbox =
        activeGateway === "nomba" && nombaBaseUrl.includes("sandbox.nomba.com");

      const namesMatchUser = (candidateName) => {
        const normalizedName = candidateName.toLowerCase();
        const userFirstName = (firstName || user.firstName).toLowerCase();
        const userLastName = (lastName || user.lastName).toLowerCase();
        const accountWords = normalizedName.split(/\s+/);
        const matchFirst = accountWords.some(
          (word) =>
            word.includes(userFirstName) || userFirstName.includes(word),
        );
        const matchLast = accountWords.some(
          (word) => word.includes(userLastName) || userLastName.includes(word),
        );
        return matchFirst && matchLast;
      };

      if (finalAccount && finalCode) {
        try {
          const { resolveAccount } = await import("@/lib/paymentGateway");
          const resolved = await resolveAccount(finalAccount, finalCode);

          if (resolved && resolved.account_name) {
            if (!namesMatchUser(resolved.account_name)) {
              if (isNombaSandbox) {
                bankVerificationWarning = `Sandbox bank lookup returned ${resolved.account_name}, which did not match your Renta profile name.`;
              } else {
                return NextResponse.json(
                  {
                    error: `The bank account name (${resolved.account_name}) does not match your registered name on Renta (${firstName || user.firstName} ${lastName || user.lastName}).`,
                  },
                  { status: 400 },
                );
              }
            }
          } else if (finalAccountName) {
            if (!namesMatchUser(finalAccountName)) {
              return NextResponse.json(
                {
                  error: `The bank account name (${finalAccountName}) does not match your registered name on Renta (${firstName || user.firstName} ${lastName || user.lastName}).`,
                },
                { status: 400 },
              );
            }

            if (isNombaSandbox) {
              bankVerificationWarning =
                "Bank account lookup could not be verified in Nomba sandbox, so we saved the manual account name you provided.";
            } else {
              bankVerificationWarning =
                "Bank account lookup could not be verified, but the manual account name provided matched your profile.";
            }
          } else if (!isNombaSandbox) {
            return NextResponse.json(
              { error: "Could not verify bank account holder name" },
              { status: 400 },
            );
          } else {
            bankVerificationWarning =
              "Bank account lookup could not be verified in Nomba sandbox.";
          }
        } catch (err) {
          if (finalAccountName) {
            if (!namesMatchUser(finalAccountName)) {
              return NextResponse.json(
                {
                  error: `The bank account name (${finalAccountName}) does not match your registered name on Renta (${firstName || user.firstName} ${lastName || user.lastName}).`,
                },
                { status: 400 },
              );
            }

            bankVerificationWarning = isNombaSandbox
              ? `Bank verification failed in Nomba sandbox (${err.message}), so we saved the manual account name you provided.`
              : `Bank verification failed (${err.message}), but the manual account name provided matched your profile.`;
          } else if (!isNombaSandbox) {
            return NextResponse.json(
              { error: `Bank verification failed: ${err.message}` },
              { status: 400 },
            );
          } else {
            bankVerificationWarning = `Bank verification failed in Nomba sandbox: ${err.message}`;
          }
        }
      }
    }

    // Build the update data object dynamically
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount || null;
    if (bankCode !== undefined) updateData.bankCode = bankCode || null;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 },
        );
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Check phone uniqueness if updating
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone && existingPhone.id !== userId) {
        return NextResponse.json(
          { error: "This phone number is already in use" },
          { status: 409 },
        );
      }
    }

    // --- Suspicious Bank Update Fraud Check ---
    if (updateData.bankAccount || updateData.bankCode) {
      const { checkSuspiciousBankUpdate } = await import("@/lib/fraudRules");
      const isFraudulent = await checkSuspiciousBankUpdate(userId);

      if (isFraudulent) {
        return NextResponse.json(
          {
            error:
              "Account suspended due to suspicious activity (Bank details changed during pending withdrawal).",
          },
          { status: 403 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        bankName: true,
        bankAccount: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
      warning: bankVerificationWarning,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
