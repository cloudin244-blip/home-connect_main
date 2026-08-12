import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  MessageCircle,
  Play,
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
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { settingsQuery, WHATSAPP_FALLBACK, createLeadFn } from "@/lib/site-data";

type Mode = "choose" | "manual" | "voice";
type Step = "name" | "mobile" | "email" | "query" | "review" | "done";
type MicState = "unknown" | "prompt" | "granted" | "denied";
type Field = "name" | "mobile" | "email" | "query";

const GREETING =
  "I am Prime Pure Real-estate Agent, please fill the form to join community.";

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(80, "Name is too long — keep it under 80 characters.")
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, "Name can only contain letters, spaces and . ' -"),
  mobile: z
    .string()
    .trim()
    .regex(
      /^[+]?[0-9][0-9\s-]{7,17}$/,
      "Enter a valid mobile number, e.g. 98765 43210 or +91 98765 43210.",
    ),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address, e.g. rahul@email.com.")
    .max(160, "Email is too long."),
  query: z.string().trim().max(500, "Please keep your query under 500 characters.").optional(),
});

const PROMPTS: Record<Step, string> = {
  name: `${GREETING} Please say your full name after the beep.`,
  mobile: "Thank you. Now please say your mobile number, digit by digit.",
  email: "Great. Now please say your email address.",
  query: "Finally, tell me your query — what kind of property are you looking for?",
  review: "Here is what I noted. Please check it, then tap join to enter our WhatsApp community.",
  done: "Wonderful. You are all set — welcome to the Prime Pure community.",
};

const LABELS: Record<Step, string> = {
  name: "What is your full name?",
  mobile: "What is your mobile number?",
  email: "What is your email address?",
  query: "What is your query?",
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
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState<Step>("name");
  const [started, setStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", query: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [heard, setHeard] = useState<string | null>(null);
  const [micState, setMicState] = useState<MicState>("unknown");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const handledRef = useRef<Set<string>>(new Set());
  const stepRef = useRef<Step>("name");
  const startRef = useRef<() => Promise<void>>(async () => {});
  const autoOpenedRef = useRef(false);
  const lastSpokenRef = useRef<string>("");

  stepRef.current = step;

  // On mobile, surface the voice-based form automatically (consent still asked).
  useEffect(() => {
    if (!isMobile || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    const timer = window.setTimeout(() => {
      setOpen(true);
      setMode("voice");
      setStep("name");
      setStarted(false);
      handledRef.current = new Set();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [isMobile]);

  // Read any previously granted/denied mic permission so we can skip or explain.
  useEffect(() => {
    if (!open || typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let active = true;
    void navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (!active) return;
        const apply = () =>
          setMicState(
            status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "prompt",
          );
        apply();
        status.onchange = apply;
      })
      .catch(() => {
        /* permission API unsupported — fall back to prompting on use */
      });
    return () => {
      active = false;
    };
  }, [open]);

  const speak = useCallback(async (text: string) => {
    lastSpokenRef.current = text;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("speechSynthesis not supported in this browser");
      return;
    }
    try {
      setSpeaking(true);
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a warm Indian English voice, or default English
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes("en-IN")) || 
                          voices.find(v => v.lang.startsWith("en"));
      
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      
      utterance.rate = 0.95; // Slightly slower for clear, warm real-estate assistance
      utterance.pitch = 1.0;

      await new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
      
      setAudioBlocked(false);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setAudioBlocked(true);
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
    setVoiceError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicState("granted");
    } catch (error) {
      const name = (error as DOMException | undefined)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicState("denied");
        setVoiceError(
          "Microphone access was blocked. Allow the mic in your browser settings, or just type your answers below — both work.",
        );
      } else if (name === "NotFoundError" || name === "NotReadableError") {
        setVoiceError(
          "We could not reach a microphone on this device. Please type your answers below instead.",
        );
      } else {
        setVoiceError("The microphone could not start. Please retry, or type your answers below.");
      }
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
        setVoiceError("That recording came through empty — tap “Speak answer” and try again.");
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
          setVoiceError("I could not catch that. Please retry a little closer to the mic.");
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
          setStep("query");
        } else if (current === "query") {
          setForm((f) => ({ ...f, query: text.slice(0, 500) }));
          setStep("review");
        }
      } catch (error) {
        console.error(error);
        setVoiceError("The voice service is busy right now. Please type your answer instead.");
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
    if (!open || mode !== "voice" || !started) return;
    if (micState === "denied") return;
    const key = `${mode}:${step}`;
    if (handledRef.current.has(key)) return;
    handledRef.current.add(key);

    let cancelled = false;
    void (async () => {
      await speak(PROMPTS[step]);
      if (cancelled) return;
      if (step === "name" || step === "mobile" || step === "email" || step === "query") {
        await startRef.current();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mode, step, started, speak, micState]);

  useEffect(() => {
    if (open) return;
    audioRef.current?.pause();
    setSpeaking(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }, [open]);

  /** Requests mic consent up front so the auto-open flow never surprises the user. */
  const beginVoice = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
    } catch (error) {
      const name = (error as DOMException | undefined)?.name ?? "";
      setMicState(name === "NotAllowedError" ? "denied" : "prompt");
      setVoiceError(
        name === "NotAllowedError"
          ? "No problem — the mic stays off. You can type your answers below, or allow the mic from your browser's address bar and retry."
          : "The microphone is unavailable. You can type your answers below instead.",
      );
      if (name === "NotAllowedError") return;
    }
    handledRef.current = new Set();
    setStep("name");
    setStarted(true);
  };

  const validateField = (field: Field, value: string) => {
    const result = leadSchema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const update = (field: Field, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) validateField(field, value);
  };

  const joinCommunity = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      await createLeadFn({
        data: {
          name: parsed.data.name,
          mobile: parsed.data.mobile,
          email: parsed.data.email,
          notes: parsed.data.query || null,
          source: mode === "voice" ? "voice_bot" : "manual_bot",
          joined_whatsapp: true,
        }
      });
      setSaving(false);
    } catch (err) {
      console.error(err);
      setSaving(false);
      toast.error("Could not save your details. Please check your connection and try again.");
      return;
    }
    setErrors({});
    setStep("done");
    toast.success("Details saved — opening the WhatsApp community");
    window.open(whatsapp, "_blank", "noopener,noreferrer");
  };

  const restart = () => {
    handledRef.current = new Set();
    setForm({ name: "", mobile: "", email: "", query: "" });
    setErrors({});
    setHeard(null);
    setVoiceError(null);
    setStep("name");
    setStarted(false);
    setMode("choose");
  };

  const statusText = speaking
    ? "Speaking…"
    : recording
      ? "Listening…"
      : thinking
        ? "Thinking…"
        : micState === "denied"
          ? "Mic off — typing works too"
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
        <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 z-50 max-h-[86vh] w-auto md:w-[23rem] overflow-y-auto rounded-lg border border-border bg-card shadow-elegant animate-rise-in">
          <div className="surface-navy flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <div>
                <p className="font-display text-base leading-none">Prime Pure · Property Agent</p>
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
              <p className="text-sm text-muted-foreground">{GREETING}</p>
              <Button
                className="h-auto w-full flex-col items-start gap-1 py-3 text-left"
                onClick={() => {
                  setMode("voice");
                  void beginVoice();
                }}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Mic className="size-4" /> Voice — I'll ask, you speak
                </span>
                <span className="text-xs font-normal opacity-80">
                  We'll ask for mic permission, then the mic opens after each question
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
                  Fill a short form: name, mobile, email and your query
                </span>
              </Button>
            </div>
          ) : step === "done" ? (
            <div className="space-y-4 p-6 text-center">
              <CheckCircle2 className="mx-auto size-9 text-accent" />
              <h3 className="font-display text-xl">You're in — details saved</h3>
              <p className="text-sm text-muted-foreground">
                Welcome to the Prime Pure community. If the WhatsApp tab did not open, use the button
                below.
              </p>
              <Button asChild className="w-full">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Open WhatsApp community
                </a>
              </Button>
              <button
                onClick={restart}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Submit another enquiry
              </button>
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

              {mode === "voice" && !started && (
                <Button className="w-full" onClick={() => void beginVoice()}>
                  <Mic className="size-4" /> Allow mic & start voice form
                </Button>
              )}

              {mode === "voice" && voiceError && (
                <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
                  <MicOff className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <p>{voiceError}</p>
                    <Button size="sm" variant="outline" onClick={() => void startRecording()}>
                      Retry microphone
                    </Button>
                  </div>
                </div>
              )}

              {mode === "voice" && audioBlocked && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void speak(lastSpokenRef.current || PROMPTS[step])}
                >
                  <Play className="size-4" /> Tap to hear the question
                </Button>
              )}

              {mode === "voice" && heard && (
                <p className="text-xs text-muted-foreground">
                  I heard: <span className="italic">“{heard}”</span>
                </p>
              )}

              {mode === "voice" && started && micState !== "denied" && (
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
                    aria-invalid={!!errors.name}
                    onBlur={(e) => validateField("name", e.target.value)}
                    onChange={(e) => update("name", e.target.value)}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vb-mobile" className="text-xs">Mobile number</Label>
                  <Input
                    id="vb-mobile"
                    value={form.mobile}
                    maxLength={20}
                    inputMode="tel"
                    className="tabular-nums"
                    placeholder="e.g. 98765 43210"
                    aria-invalid={!!errors.mobile}
                    onBlur={(e) => validateField("mobile", e.target.value)}
                    onChange={(e) => update("mobile", e.target.value)}
                  />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vb-email" className="text-xs">Email</Label>
                  <Input
                    id="vb-email"
                    value={form.email}
                    maxLength={160}
                    inputMode="email"
                    placeholder="e.g. rahul@email.com"
                    aria-invalid={!!errors.email}
                    onBlur={(e) => validateField("email", e.target.value)}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vb-query" className="text-xs">Your query</Label>
                  <Textarea
                    id="vb-query"
                    value={form.query}
                    maxLength={500}
                    rows={3}
                    placeholder="e.g. Looking for a 3BHK in Electronic City under ₹1.2 Cr"
                    aria-invalid={!!errors.query}
                    onChange={(e) => update("query", e.target.value)}
                  />
                  {errors.query && <p className="text-xs text-destructive">{errors.query}</p>}
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
