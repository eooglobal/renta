import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

const PDR_CONTENT = `
# Renta Platform Knowledge Base
Renta is a verified-only apartment marketplace in Nigeria, operated by Landmark Property Oasis Ltd (RC 9137107), currently focusing on Kwara State (Ilorin, Tanke, Basin, Fate, Tipper Offa, Malete, etc.).

## Core Rules & Policies
- Physical Property Inspection Fee: Physical property inspections for tenants are pegged at a flat fee of ₦2,000. Renta NEVER charges traditional agency fees, form fees, or legal fees. Renta field staff coordinate and accompany tenants to inspect properties for this flat ₦2,000 fee.
- Property Verification: Every single property listed on Renta undergoes mandatory physical inspection and verification by Renta field officers before being published online.
- Pricing & Fees: The landlord sets the base rent. Renta adds a transparent 10% platform service fee.
- No Hidden Fees: NO agency fees, NO legal fees, NO development levies, and NO caution fees (unless the landlord explicitly specifies a caution deposit in the listing description). Inspection fee is ₦2,000 flat.
- Registration Verification: Registration requires a 6-digit OTP code sent via SMS or Email during signup to verify account ownership.
- Payments & Protection: Tenants pay securely through Renta using Paystack split settlement. All payments are backed by Renta platform transaction records and a 24-hour dispute protection window.
- Rented Property Media Policy: Media for rented properties (walkthrough videos and secondary images) are automatically purged after 14 days to preserve privacy and cloud storage.

## User Roles
- Tenants: Search verified listings, book physical inspections (₦2,000 flat fee), view video walkthroughs, complete 6-digit OTP verification, and pay securely through Renta.
- Landlords: List properties for free, receive verified tenant leads, manage listings, and receive payout settlements directly into their registered bank account.
- Scouts: Source and onboard real properties, earning lucrative commissions on successful rentals.
- Affiliates: Refer tenants and landlords to Renta via unique referral links and earn referral commissions.

## Frequently Asked Questions (FAQ)

### Tenant Questions:
- How much is physical property inspection? Physical property inspection is pegged at a flat fee of ₦2,000. Renta does NOT charge agency fees or traditional viewing form fees.
- How do I book an inspection? Click "Schedule Inspection" on any active property listing. Renta staff will contact you to confirm a date and accompany you to inspect the apartment.
- Is there a video walkthrough? Yes! Every verified listing includes high-quality photos and walkthrough videos so you can view the property online before visiting in person.
- How do payments work? Tenants pay through Renta's secure payment gateway. Funds are protected with 24-hour dispute coverage.
- Are there agency or legal fees? No. Renta eliminates traditional agency and legal fees. You only pay the listed rent plus Renta's flat 10% service fee. Inspection fee is ₦2,000 flat.

### Landlord Questions:
- Is listing a property free? Yes, listing properties on Renta is 100% free for landlords.
- Who sets the rent amount? The landlord has total freedom to set their rent price.
- How do payouts work? Payments are processed via Paystack split settlement directly into the landlord's verified bank account.
- How do I verify my property? After you submit a listing, Renta's verification team will conduct a physical inspection to verify the property before publishing it live.

### Scout & Affiliate Questions:
- How do Scouts earn? Scouts earn commissions when their onboarded properties are successfully rented.
- How do Affiliates earn? Affiliates earn commissions by sharing their referral link to bring new users to Renta.

## Support & Assistance
- For account support, payment disputes, or custom inquiries, direct users to email **hello@userenta.com**.
- Current primary operational city: Ilorin, Kwara State, Nigeria.
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
