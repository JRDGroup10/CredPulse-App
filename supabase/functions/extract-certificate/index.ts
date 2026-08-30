// Supabase Edge Function — reads an uploaded certificate (image or PDF)
// with Claude's vision capability and returns structured fields. This is
// the ONLY piece of "AI extraction" in the app — everything downstream
// (attaching a renewal tip/link, matching a known template) happens
// client-side in src/lib/mockExtract.ts's enrichWithTemplate(), which this
// function's output feeds into. Keep this function's job narrow: read the
// document, return { name, issuer, credentialType, issuedDate, expiryDate,
// confidence } as JSON. Nothing else.
//
// Called from src/lib/store.ts's extractCertificate(), which falls back to
// the local demo extractor (mockExtractCertificate) if this function isn't
// deployed, ANTHROPIC_API_KEY isn't set, or anything here throws — so the
// app keeps working end-to-end either way. That fallback is silent by
// design (console.warn only), so if uploads still look demo-ish after
// deploying this, check the browser console for that warning first.
//
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
//
// Deploy with:
//   supabase functions deploy extract-certificate

import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-haiku-4-5-20251001";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — comfortably under Anthropic's per-file limits

const SYSTEM_PROMPT = `You read healthcare certification/license/training documents (photos or PDFs) and extract structured data. Respond with ONLY a single JSON object, no prose before or after, no markdown code fences. The JSON object must have exactly these keys:

{
  "name": string — the credential's name, e.g. "Basic Life Support (BLS)". Use the full, standard name of the credential, not just what's printed if it's abbreviated oddly.
  "issuer": string — the organization that issued it, e.g. "American Heart Association". Empty string if genuinely not visible.
  "credentialType": one of "certification", "license", or "training" — pick the closest match.
  "issuedDate": string in YYYY-MM-DD format — the date this specific credential was issued/completed. Empty string if not visible.
  "expiryDate": string in YYYY-MM-DD format — the date this credential expires or must be renewed by. If the document shows a validity period (e.g. "valid for 2 years from issue date") instead of an explicit expiry date, calculate it from the issued date. This field is required — make your best reasonable estimate if it's ambiguous, and lower confidence accordingly.
  "confidence": number between 0 and 1 — your genuine confidence that the above fields are accurate. Use lower values (below 0.7) when the image is blurry, cropped, a non-certificate document, or fields had to be guessed.
}

If the document is clearly not a certificate/license/training record at all, still return your best-effort JSON with a low confidence score — never refuse or return anything other than the JSON object.`;

function corsJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return corsJson({ error: "AI extraction isn't configured on the server yet (missing ANTHROPIC_API_KEY)." }, 500);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return corsJson({ error: "No file was uploaded." }, 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return corsJson({ error: "That file is too large — try a photo under 10MB." }, 400);
    }

    const mediaType = file.type || "application/octet-stream";
    const isPdf = mediaType === "application/pdf";
    const isImage = mediaType.startsWith("image/");

    if (!isPdf && !isImage) {
      return corsJson({ error: "Unsupported file type — upload a JPG, PNG, or PDF." }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64Data = bytesToBase64(bytes);

    const documentBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [documentBlock, { type: "text", text: "Extract this certificate's details as the JSON object described." }]
          }
        ]
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return corsJson({ error: "The AI extraction service returned an error." }, 502);
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData?.content?.[0]?.text ?? "";

    // Claude was told to return ONLY JSON, but strip any accidental code
    // fences / stray prose just in case, by grabbing the first {...} block.
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude's response:", rawText);
      return corsJson({ error: "Couldn't parse the AI's response." }, 502);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("Failed to parse extracted JSON:", parseErr, rawText);
      return corsJson({ error: "Couldn't parse the AI's response." }, 502);
    }

    return corsJson({
      name: typeof parsed.name === "string" ? parsed.name : "Unnamed Certification",
      issuer: typeof parsed.issuer === "string" ? parsed.issuer : "",
      credentialType: ["certification", "license", "training"].includes(parsed.credentialType as string)
        ? parsed.credentialType
        : "certification",
      issuedDate: typeof parsed.issuedDate === "string" ? parsed.issuedDate : "",
      expiryDate: typeof parsed.expiryDate === "string" && parsed.expiryDate ? parsed.expiryDate : new Date().toISOString().slice(0, 10),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5
    });
  } catch (err) {
    console.error("extract-certificate error:", err);
    return corsJson({ error: "Couldn't extract this certificate. Try again." }, 500);
  }
});
