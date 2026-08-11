import { createFileRoute } from "@tanstack/react-router";

const EXT_BY_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

const MAX_BYTES = 8 * 1024 * 1024;

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Voice service not configured (GEMINI_API_KEY missing)" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response(JSON.stringify({ error: "Expected multipart form data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size < 1024) {
          return new Response(
            JSON.stringify({ error: "That recording was empty — please try again." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (audio.size > MAX_BYTES) {
          return new Response(JSON.stringify({ error: "Recording is too long." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Convert the audio file to base64
        const arrayBuffer = await audio.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const audioBase64 = buffer.toString("base64");
        const baseType = (audio.type || "audio/webm").split(";")[0]!;

        // Call Gemini 1.5 Flash to transcribe the audio file
        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: baseType,
                        data: audioBase64,
                      },
                    },
                    {
                      text: "You are an audio transcription service. Please transcribe the provided speech audio exactly. Output ONLY the transcription text. Do not add any conversational filler, notes, or explanations.",
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Gemini transcription failed [${upstream.status}]: ${detail}`);
          return new Response(
            JSON.stringify({ error: "Could not understand that recording. Please try again." }),
            { status: upstream.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const result = await upstream.json();
        const transcription = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

        return new Response(JSON.stringify({ text: transcription }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
