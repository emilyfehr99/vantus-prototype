import { NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalysisRequest, AnalysisResponse, VerdictType } from "@/types";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export async function POST(req: Request) {
    try {
        const body: AnalysisRequest = await req.json();
        const { contractText, clientEmail, tone } = body;

        if (!contractText || !clientEmail) {
            return NextResponse.json(
                { error: "Contract and Email content are required" },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            // Fallback for demo/no-key environment
            console.warn("OPENAI_API_KEY is missing. Using mock response.");
            return NextResponse.json({
                verdict: VerdictType.OUT_OF_SCOPE,
                reasoning: "The SOW explicitly excludes 'additional pages', which implies SEO articles are also out of scope as they are new content pages.",
                suggestedSubject: "Re: Quick favor? (OOS - Change Order Required)",
                emailDraft: "Hi [Client Name],\n\nThanks for reaching out! While I'd love to help with the blog section, our current SOW covers the Homepage and Contact Page only. Content writing and SEO services are listed as exclusions.\n\nI've attached a Change Order for the additional blog design and article writing. Once signed, we can get this scheduled!\n\nBest,\n[Your Name]",
                estimatedValue: "$450 - $600"
            } as AnalysisResponse);
        }

        let toneInstruction = "";
        switch (tone) {
            case 'soft':
                toneInstruction = "Tone: 'Soft' (The Diplomat). Gentle pushback. Start with 'I'd love to help, but...'. Frame the extra cost as a standard procedure. Assume positive intent.";
                break;
            case 'firm':
                toneInstruction = "Tone: 'Firm' (The Standard). Professional but strict. 'That is not in the SOW. We need a change order.' No apologizing.";
                break;
            case 'hard':
                toneInstruction = "Tone: 'Hard' (The Lawyer). Cold, direct, demanding payment. Quote specific section numbers from the contract if possible. 'Per Section X, this is billable.' Attach the invoice mentally.";
                break;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are ScopeGuard, an AI Project Manager designed to turn Scope Creep into Billable Hours. Your goal is to eliminate unbilled work.
          
          You will analyze a Master Services Agreement (MSA/SOW) and a Client Request.
          
          Task:
           1. Compare the request against the SOW.
           2. Determine if the request is IN_SCOPE or OUT_OF_SCOPE. If the SOW doesn't explicitly mention it, it is OUT_OF_SCOPE.
           3. Draft a response email.
              - ${toneInstruction}
              - If OUT_OF_SCOPE: You MUST pivot to a sale. State clearly that a "Change Order" is required.
              - If IN_SCOPE: Confirm receipt and timeline.

          Return the result in JSON format matching this schema:
          {
            "verdict": "IN_SCOPE" | "OUT_OF_SCOPE" | "UNCLEAR",
            "reasoning": "Short explanation",
            "suggestedSubject": "Email subject line",
            "emailDraft": "Full email body",
            "estimatedValue": "Optional price range string if OUT_OF_SCOPE"
          }
          `
                },
                {
                    role: "user",
                    content: `MASTER SERVICES AGREEMENT / SOW:
          """
          ${contractText}
          """
          
          CLIENT REQUEST:
          """
          ${clientEmail}
          """`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const result = JSON.parse(content) as AnalysisResponse;

        return NextResponse.json(result);
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate analysis" },
            { status: 500 }
        );
    }
}
