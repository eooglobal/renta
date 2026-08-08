/**
 * Schema.org FAQPage Structured Data for Renta
 * Provides direct, clear Q&A data for AI search engines (Perplexity, ChatGPT Search, Gemini, Google AI Overviews)
 */

export default function FaqStructuredData({ faqs }) {
    const defaultFaqs = [
        {
            question: "How does Renta verify apartments in Ilorin?",
            answer: "Renta employs verified local scouts who physically visit, inspect, document, and verify every property listing in Ilorin before it goes live. This eliminates fake listings, agent price inflation, and ghost landlords."
        },
        {
            question: "What fees does Renta charge tenants?",
            answer: "Renta charges a transparent 10% platform service fee on rent payments. There are zero hidden agent markups, no inspection fees, and no artificial price inflations."
        },
        {
            question: "Are rent payments secure on Renta?",
            answer: "Yes. All transactions are securely processed via licensed payment gateways (Paystack/Nomba). Funds are held safely in escrow until the inspection period completes or rental agreement is signed."
        },
        {
            question: "Can student housing be rented on Renta in Ilorin?",
            answer: "Yes, Renta features verified student housing, self-contains, and single rooms near major institutions including University of Ilorin (Unilorin), Kwara State University (KWASU), and Kwara State Polytechnic in Tanke, Basin, Malete, and Oke-Odo."
        }
    ];

    const questionsList = (faqs || defaultFaqs).map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
        }
    }));

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": questionsList
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
    );
}
