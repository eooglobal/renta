import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

const PDR_CONTENT = `
# Renta Platform Knowledge Base
Renta is a verified-only apartment marketplace in Nigeria, starting in Ilorin.
Renta is a product of Landmark Property Oasis Ltd.

## Core Rules
- Verification: Every property is physically inspected before it goes live.
- Pricing: The landlord sets the rent. Renta adds a flat 10% service fee.
- Fees: No agency fees, no development levies, and no caution fees unless the landlord clearly states otherwise in the property description.
- Payments: Tenants pay through Renta. New rentals use secure Paystack split settlement with platform records and dispute support.

## User Roles
- Tenants: Search listings, book inspections, complete screening, and pay securely through Renta.
- Landlords: List properties, manage listings, receive verified leads, and request withdrawals to their registered bank account.
- Scouts: Source and onboard properties, then earn commissions on successful outcomes.
- Affiliates: Refer users and earn commissions through online promotion.

## Tenant FAQ
- Is inspection free? Yes, inspection booking is free.
- How do I know a property is available? If a property is visible and not marked as rented, it is available.
- Can I contact the landlord before renting? Direct messaging is only available for active rentals.
- How do payments work? Payments go through Renta using secure gateway settlement and platform dispute records.
- What must I complete before renting? Identity verification and tenant screening are required before renting.

## Landlord FAQ
- Can I list my property for free? Yes.
- Who sets the rent? The landlord sets the rent.
- When do I get paid? Eligible direct-split payments settle through Paystack to verified payout accounts.
- How do withdrawals work? Withdrawals are sent to the landlord’s registered bank account after request processing.
- Do I need to verify my bank account? Yes, bank details are required for withdrawals.

## Scout & Affiliate FAQ
- Do scouts earn commissions? Yes, scouts earn commissions for successful property onboarding and related outcomes.
- Do affiliates earn commissions? Yes, affiliates earn commissions for successful referrals.
- Should the assistant quote exact commission rates? Only if the user specifically asks.

## Coverage
- Current focus area: Ilorin, including places like Tanke, Basin, and Malete.

## Support Guidance
- If the user asks about a feature that is unavailable, say so clearly.
- If the user asks for account-specific help, payment disputes, or anything needing human review, direct them to hello@userenta.com.
- If the user asks something uncertain or outside this knowledge base, do not guess. Refer them to contact support.
`;

export async function GET() {
  const GROQ_API_KEY =
    (await getSetting("GROQ_API_KEY")) || process.env.GROQ_API_KEY;

  return NextResponse.json({
    status: "ok",
    service: "support-chat",
    methods: ["POST", "OPTIONS"],
    configured: !!GROQ_API_KEY,
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

export async function POST(request) {
  const GROQ_API_KEY =
    (await getSetting("GROQ_API_KEY")) || process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      {
        reply:
          "I'm sorry, my AI brain (API key) isn't configured yet. Please contact admin.",
      },
      { status: 500 },
    );
  }

  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A message is required to use AI support." },
        { status: 400 },
      );
    }

    const messages = [
      {
        role: "system",
        content: `You are Renta AI, the official support assistant for the Renta platform.
                Use the following Knowledge Base to answer user questions precisely.
                If you don't know the answer, ask them to contact hello@userenta.com.
                Be helpful, professional, and concise. Use Naira (₦) for currency.

                CONFIDENTIALITY & SCOPE RULES:
                - DO NOT disclose technical architecture, database types, or specific code libraries (e.g., Next.js, Prisma, MySQL, Aiven).
                - DO NOT disclose internal security mechanisms or exact rate-limiting logic.
                - DO NOT disclose internal infrastructure providers (e.g., Render, Contabo).
                - Focus exclusively on user-facing features, roles, and platform rules.
                - Only share Scout/Affiliate commission rates if specifically asked about those roles.
                - If a user asks about account-specific status, payment disputes, KYC reviews, or anything requiring human intervention, tell them to contact hello@userenta.com.
                - If the answer is not in the knowledge base, do not invent details.

                FORMATTING RULES:
                - Use emojis (like ✅, 🏠, 🔑) as bullet points for lists.
                - DO NOT use asterisks (*) for bullet points.
                - Use double newlines between paragraphs for better readability.

                KNOWLEDGE BASE:
                ${PDR_CONTENT}`,
      },
      ...history
        .filter(
          (msg) =>
            msg &&
            typeof msg.content === "string" &&
            typeof msg.role === "string",
        )
        .map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || "Groq API Error";
      return NextResponse.json(
        { error: `AI support is temporarily unavailable: ${errorMessage}` },
        { status: response.status || 500 },
      );
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json(
        { error: "AI support did not return a valid reply." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Support Chat Error:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "AI support is temporarily unavailable. Please try again later.",
      },
      { status: 500 },
    );
  }
}
