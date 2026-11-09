
export interface Env {
  AI: Ai;
}

interface ChatRequest {
  message: string;
  context?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  source?: string;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/ai-chat") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405, headers: corsHeaders }
        );
      }

      try {
        const body = (await request.json()) as ChatRequest;

        if (!body.message || typeof body.message !== "string") {
          return Response.json(
            { error: "Message is required" },
            { status: 400, headers: corsHeaders }
          );
        }

        const context = Array.isArray(body.context)
          ? body.context.slice(-20)
          : [];

        const messages = [
          {
            role: "system",
            content: `You are FlyTripVisa AI, a helpful multilingual travel and visa assistant.

Help users with:
- Visa information and application guidance
- Flights and hotels
- China, Dubai, UAE and international travel
- Business setup and travel documentation

Rules:
- Reply in the language used by the customer.
- Be clear, friendly and professional.
- Never invent visa prices, approval guarantees, flight availability or booking confirmations.
- If information is uncertain, say so.
- Do not claim that a booking or payment has been completed.
- Ask for missing details when necessary.
- Provide practical next steps.`,
          },
          ...context
            .filter(
              (item) =>
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .map((item) => ({
              role: item.role,
              content: item.content.slice(0, 4000),
            })),
          {
            role: "user",
            content: body.message.slice(0, 4000),
          },
        ];

        const result = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1000,
        });

        const reply =
          typeof result === "object" &&
          result !== null &&
          "response" in result
            ? String(result.response)
            : "";

        if (!reply) {
          throw new Error("AI returned an empty response");
        }

        return Response.json(
          {
            reply,
            source: "cloudflare-workers-ai",
          },
          { headers: corsHeaders }
        );
      } catch (error) {
        console.error("AI Chat Error:", error);

        return Response.json(
          {
            error: "AI service temporarily unavailable",
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response("FlyTripVisa AI Worker is running.", {
      headers: corsHeaders,
    });
  },
};
