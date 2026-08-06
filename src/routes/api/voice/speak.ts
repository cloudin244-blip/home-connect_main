import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  text: z.string().trim().min(1).max(600),
});

export const Route = createFileRoute("/api/voice/speak")({
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

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid text" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: parsed.data.text,
            voice: "alloy",
            response_format: "mp3",
            instructions:
              "Speak as a warm, confident Indian real-estate concierge. Friendly, unhurried, clear.",
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`TTS failed [${upstream.status}]: ${detail}`);
          return new Response(JSON.stringify({ error: "Speech generation failed" }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const audio = await upstream.arrayBuffer();
        return new Response(audio, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
