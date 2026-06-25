import { NextResponse } from 'next/server';

const PDR_CONTENT = `
# Renta Platform Knowledge Base (PDR Summary)
Renta is a verified-only apartment marketplace in Nigeria (starting in Ilorin).

## Core Rules:
- Verification: Every property is physically inspected. No fake listings.
- Pricing: Landlord sets the rent. Renta adds a flat 10% Service Fee.
- Fees: NO agency fees, NO development levies, NO caution fees (unless explicitly stated by landlord in description). Total = Rent + 10% Renta Fee.
- Escrow: Tenants pay Renta. Renta holds funds. Landlord is paid ONLY after Tenant moves in and confirms access.
- Roles:
  - Tenants: Search, Inspect (Free), Pay via Escrow.
  - Landlords: List for Free, receive verified leads.
  - Scouts: Onboard houses, earn 3% commission.
  - Affiliates: Online marketing, earn 2% commission.

## FAQ:
- Is inspection free? Yes.
- How do I check if a room is available? Browse the listings on the Home/Search page. If a property is visible and NOT marked as 'Rented', it is available. 
- Can I message a landlord before renting? No, direct messaging is available only for active rentals to ensure safety and prevent scams.
- How do I get paid? Automated payout after tenant confirms move-in.
- Where is Renta available? Currently Ilorin (Tanke, Basin, Malete).
`;

export async function POST(request) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return NextResponse.json({ reply: "I'm sorry, my AI brain (API Key) isn't configured yet. Please contact admin." }, { status: 500 });
    }

    try {
        const { message, history } = await request.json();

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
                
                FORMATTING RULES:
                - Use emojis (like ✅, 🏠, 🔑) as bullet points for lists. 
                - DO NOT use asterisks (*) for bullet points.
                - Use double newlines between paragraphs for better readability.
                
                KNOWLEDGE BASE:
                ${PDR_CONTENT}`
            },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Groq API Error');
        }

        return NextResponse.json({
            reply: data.choices[0].message.content
        });

    } catch (error) {
        console.error('Support Chat Error:', error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}
