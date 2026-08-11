import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import logo from "@/assets/prime-pure-logo.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login | Prime Pure Real Estate" },
      {
        name: "description",
        content: "Sign in to the Prime Pure Real Estate admin console to manage listings, videos and leads.",
      },
      { property: "og:title", content: "Login | Prime Pure Real Estate" },
      { property: "og:description", content: "Admin console access for Prime Pure." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/admin" });
      return;
    }
    const { error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You can sign in now.");
    setMode("signin");
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
        <img src={logo.url} alt="Prime Pure Real Estate logo" className="h-14 w-14 rounded-sm object-cover" />
        <h1 className="mt-6 font-display text-3xl">
          {mode === "signin" ? "Login" : "Create account"}
        </h1>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" inputMode="email" value={email} maxLength={160} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} maxLength={72} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            <ShieldCheck className="size-4" /> {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={google}>
          Continue with Google
        </Button>

        <button
          className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
