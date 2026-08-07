import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Keyboard,
  Loader2,
  Mic,
  MessageCircle,
  Square,
  Volume2,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, WHATSAPP_FALLBACK } from "@/lib/site-data";

type Mode = "choose" | "manual" | "voice";
type Step = "name" | "mobile" | "email" | "review" | "done";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^[+]?[0-9][0-9\s-]{7,17}$/, "Please enter a valid mobile number"),
  email: z.string().trim().email("Please enter a valid email address").max(160),
});

const PROMPTS: Record<Step, string> = {
  name: "Namaste! I am Pure, the Prime Pure property assistant. Please say your full name after the beep.",
  mobile: "Thank you. Now please say your mobile number, digit by digit.",
  email: "Great. Finally, please say your email address.",
  review: "Here is what I noted. Please check it, then tap join to enter our WhatsApp community.",
  done: "Wonderful. You are all set — welcome to the Prime Pure community.",
};

const LABELS: Record<Step, string> = {
  name: "What is your full name?",
  mobile: "What is your mobile number?",
  email: "What is your email address?",
  review: "Please review your details, then join our WhatsApp community.",
  done: "You are all set — welcome to the Prime Pure community.",
};

function cleanEmail(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s+underscore\s+/g, "_")
    .replace(/\s+dash\s+|\s+hyphen\s+/g, "-")
    .replace(/\s+/g, "")
    .replace(/[.,]$/, "");
}

function cleanMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length > 10 ? `+${digits}` : digits;
}

function cleanName(raw: string) {
  return raw
    .replace(/^(my name is|i am|this is|it's)\s+/i, "")
    .replace(/[.]$/, "")
    .trim()
    .slice(0, 80);
}

export function VoiceBot() {
  const { data: settings } = useQuery(settingsQuery);
  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState<Step>("name");
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "" });
  const [heard, setHeard] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const handledRef = useRef<Set<string>>(new Set());
  const stepRef = useRef<Step>("name");
  const startRef = useRef<() => Promise<void>>(async () => {});

  stepRef.current = step;

  /** Speaks text and resolves once playback finishes (or fails). */
  const speak = useCallback(async (text: string) => {
    try {
      setSpeaking(true);
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`speak ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => resolve();
        void audio.play().catch(() => resolve());
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSpeaking(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    audioRef.current?.pause();
    setSpeaking(false);
    setHeard(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access is needed. You can also type your answer below.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      if (blob.size < 1500) {
        toast.error("That recording was empty — please try again.");
        return;
      }
      setThinking(true);
      try {
        const body = new FormData();
        body.append("audio", blob, "recording");
        const res = await fetch("/api/voice/transcribe", { method: "POST", body });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Transcription failed");
        const text = (data.text ?? "").trim();
        setHeard(text || null);
        if (!text) {
          toast.error("I could not hear that. Please try again.");
          return;
        }
        const current = stepRef.current;
        if (current === "name") {
          setForm((f) => ({ ...f, name: cleanName(text) }));
          setStep("mobile");
        } else if (current === "mobile") {
          setForm((f) => ({ ...f, mobile: cleanMobile(text) }));
          setStep("email");
        } else if (current === "email") {
          setForm((f) => ({ ...f, email: cleanEmail(text) }));
          setStep("review");
        }
      } catch (error) {
        console.error(error);
        toast.error("Voice service is busy. Please type your answer instead.");
      } finally {
        setThinking(false);
      }
    };

    recorder.start();
    setRecording(true);
    window.setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
        setRecording(false);
      }
    }, 12000);
  }, []);

  startRef.current = startRecording;

  // Voice mode: speak the prompt, then open the mic automatically.
  useEffect(() => {
    if (!open || mode !== "voice") return;
    const key = `${mode}:${step}`;
    if (handledRef.current.has(key)) return;
    handledRef.current.add(key);

    let cancelled = false;
    void (async () => {
      await speak(PROMPTS[step]);
      if (cancelled) return;
      if (step === "name" || step === "mobile" || step === "email") {
        await startRef.current();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mode, step, speak]);

  useEffect(() => {
    if (open) return;
    audioRef.current?.pause();
    setSpeaking(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }, [open]);

  const joinCommunity = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      source: mode === "voice" ? "voice_bot" : "manual_bot",
      joined_whatsapp: true,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Could not save your details. Please try again.");
      return;
    }
    setStep("done");
    toast.success("Details saved — opening the WhatsApp community");
    window.open(whatsapp, "_blank", "noopener,noreferrer");
  };

  const restart = () => {
    handledRef.current = new Set();
    setForm({ name: "", mobile: "", email: "" });
    setHeard(null);
    setStep("name");
    setMode("choose");
  };

  const statusText = speaking
    ? "Speaking…"
    : recording
      ? "Listening…"
      : thinking
        ? "Thinking…"
        : "Ready";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-primary px-5 py-4 text-primary-foreground shadow-elegant transition-transform hover:scale-105"
          aria-label="Talk to the Prime Pure assistant"
        >
          <span className="relative flex size-6 items-center justify-center">
            <span className="absolute inset-0 rounded-full animate-pulse-ring" />
            <Mic className="size-5 text-accent" />
          </span>
          <span className="hidden text-sm font-medium sm:inline">Talk to Pure</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(94vw,23rem)] overflow-hidden rounded-lg border border-border bg-card shadow-elegant animate-rise-in">
          <div className="surface-navy flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <div>
                <p className="font-display text-base leading-none">Pure · Property Assistant</p>
                <p className="text-[0.65rem] opacity-70">
                  {mode === "choose" ? "Choose how you'd like to share details" : statusText}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="size-4 opacity-80 hover:opacity-100" />
            </button>
          </div>

          {mode === "choose" ? (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                I can add you to our WhatsApp community for early access to new listings. How would you
                like to share your name, mobile number and email?
              </p>
              <Button
                className="h-auto w-full flex-col items-start gap-1 py-3 text-left"
                onClick={() => {
                  handledRef.current = new Set();
                  setStep("name");
                  setMode("voice");
                }}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Mic className="size-4" /> Voice — I'll ask, you speak
                </span>
                <span className="text-xs font-normal opacity-80">
                  The mic opens automatically after each question
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-1 py-3 text-left"
                onClick={() => {
                  setStep("review");
                  setMode("manual");
                }}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Keyboard className="size-4" /> Manual — I'll type it myself
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Fill a short three-field form
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="flex gap-2 rounded-md bg-muted p-3 text-sm">
                {mode === "voice" ? (
                  <Volume2 className="mt-0.5 size-4 shrink-0 text-accent" />
                ) : (
                  <Keyboard className="mt-0.5 size-4 shrink-0 text-accent" />
                )}
                <p>{mode === "voice" ? PROMPTS[step] : LABELS[step]}</p>
              </div>

              {mode === "voice" && heard && (
                <p className="text-xs text-muted-foreground">
                  I heard: <span className="italic">“{heard}”</span>
                </p>
              )}

              {mode === "voice" && step !== "done" && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={recording ? stopRecording : () => void startRecording()}
                    disabled={thinking}
                    variant={recording ? "destructive" : "default"}
                    className="flex-1"
                  >
                    {thinking ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : recording ? (
                      <Square className="size-4" />
                    ) : (
                      <Mic className="size-4" />
                    )}
                    {recording ? "Stop & send" : thinking ? "Processing" : "Speak answer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void speak(PROMPTS[step])}
                    disabled={speaking}
                    aria-label="Repeat the question"
                  >
                    <Volume2 className="size-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="vb-name" className="text-xs">Full name</Label>
                  <Input
                    id="vb-name"
                    value={form.name}
                    maxLength={80}
                    placeholder="e.g. Rahul Sharma"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vb-mobile" className="text-xs">Mobile number</Label>
                  <Input
                    id="vb-mobile"
                    value={form.mobile}
                    maxLength={20}
                    inputMode="tel"
                    placeholder="e.g. 98765 43210"
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vb-email" className="text-xs">Email</Label>
                  <Input
                    id="vb-email"
                    value={form.email}
                    maxLength={160}
                    inputMode="email"
                    placeholder="e.g. rahul@email.com"
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={joinCommunity} disabled={saving} className="w-full">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                Join WhatsApp community
              </Button>

              <button
                onClick={restart}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
