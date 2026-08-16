// Supabase Edge Function — real AI certificate extraction.
//
// Receives an uploaded certificate photo/PDF from the client, sends it to
// Claude (Anthropic's vision-capable model) with a strict extraction prompt,
// and returns structured JSON. This function requires a valid Supabase user
// session (Supabase verifies the JWT automatically before invoking it) and
// the ANTHROPIC_API_KEY secret to be set — see DEPLOYMENT.md.
//
// Deploy with:
//   supabase functions deploy extract-certificate
// Set the secret once with:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — Anthropic's per-file limit

interface ExtractedCore {
  name: string;
  issuer: string;
  credentialType: "certification" | "license" | "training";
  issuedDate: string;
  expiryDate: string;
  confidence: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function extractJson(text: string): unknown {
  // Claude sometimes wraps JSON in a markdown code fence despite instructions — strip it.
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI extraction isn't configured on the server yet (missing ANTHROPIC_API_KEY)." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const region = (form.get("region") as string) === "US" ? "US" : "CA";

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (file.size > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: "File is too large (max 15MB)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const mediaType = file.type || "application/octet-stream";
    const isPdf = mediaType === "application/pdf";
    const isImage = mediaType.startsWith("image/");

    if (!isPdf && !isImage) {
      return new Response(JSON.stringify({ error: "Only images (JPG/PNG/WEBP) or PDFs are supported." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const base64Data = arrayBufferToBase64(await file.arrayBuffer());
    const today = new Date().toISOString().slice(0, 10);

    const contentBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };

    const prompt = `You are extracting structured data from a photo or scan of a professional certification, license, or training record belonging to a healthcare worker in ${region === "US" ? "the United States" : "Canada"}. Today's date is ${today}.

Look at the document and return ONLY a single JSON object (no markdown, no commentary) with exactly these fields:
{
  "name": "full certification/license name, e.g. 'Basic Life Support (BLS)'",
  "issuer": "the organization that issued it",
  "credentialType": "certification" | "license" | "training",
  "issuedDate": "YYYY-MM-DD, your best reading of the issue/completion date on the document",
  "expiryDate": "YYYY-MM-DD, your best reading of the expiry/renewal-due date on the document",
  "confidence": a number from 0 to 1 reflecting how confident you are in this extraction overall
}

If a date is genuinely illegible or absent, make your best reasonable estimate given standard renewal cycles for that credential type and lower the confidence score accordingly. Never leave a field blank.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [contentBlock, { type: "text", text: prompt }]
          }
        ]
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed. Try again or enter details manually." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const anthropicJson = await anthropicRes.json();
    const text = anthropicJson?.content?.[0]?.text ?? "";

    let parsed: ExtractedCore;
    try {
      parsed = extractJson(text) as ExtractedCore;
    } catch (parseErr) {
      console.error("Failed to parse model output as JSON:", text, parseErr);
      return new Response(JSON.stringify({ error: "Couldn't read that document clearly. Try a clearer photo or enter details manually." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("extract-certificate error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
