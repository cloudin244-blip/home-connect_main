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
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Voice service not configured" }), {
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

        const baseType = (audio.type || "audio/webm").split(";")[0]!;
        const ext = EXT_BY_TYPE[baseType] ?? "webm";

        const upstreamForm = new FormData();
        upstreamForm.append("model", "openai/gpt-4o-transcribe");
        upstreamForm.append("file", audio, `recording.${ext}`);

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstreamForm,
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Transcription failed [${upstream.status}]: ${detail}`);
          return new Response(
            JSON.stringify({ error: "Could not understand that recording. Please try again." }),
            { status: upstream.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const result = (await upstream.json()) as { text?: string };
        return new Response(JSON.stringify({ text: result.text ?? "" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
