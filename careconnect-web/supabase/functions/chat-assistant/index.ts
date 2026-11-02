import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ── CORS headers ───────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── System prompt ─────────────────────────────────────────────────────────────
// Strictly scoped: explain CareConnect, help with sign-up/sign-in, no medical advice.

const SYSTEM_PROMPT = `You are the CareConnect assistant. Your ONLY role is to:
1. Explain what CareConnect is and how it works
2. Describe who CareConnect is for: care recipients (people who benefit from having their daily routine clearly laid out) and their caregivers (family members or professional carers)
3. Help users understand the difference between signing up (creating a new account) and signing in (returning to an existing account), and walk them through either process
4. Answer questions about privacy and data handling
5. Describe CareConnect's features: daily schedule, medication reminders, memory cards, contacts, and caregiver notes

You must NEVER provide medical advice, medication dosages, clinical guidance, diagnoses, or health recommendations of any kind. If a user asks anything medical or clinical, respond warmly and firmly: "I'm not able to give medical or health advice. Please speak with your doctor, pharmacist, or caregiver about that. I'm happy to help you understand CareConnect or assist with signing up!"

Keep responses concise — 2 to 4 short sentences. Use plain, warm, and reassuring language. Avoid jargon. Never use bullet points or markdown in your replies.`;

// ── Request shape ─────────────────────────────────────────────────────────────

interface RequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    // No key configured — signal the client to use its scripted fallback
    if (!apiKey) {
      return new Response(
        JSON.stringify({ useFallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as RequestBody;
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Anthropic Messages API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      // Signal the client to fall back gracefully
      return new Response(
        JSON.stringify({ useFallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicRes.json();
    const reply: string = data?.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("chat-assistant error:", err);
    return new Response(
      JSON.stringify({ useFallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
