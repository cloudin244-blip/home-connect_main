import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
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
  message: z.string().trim().max(600, "Please keep your requirement under 600 characters.").optional(),
});

type Field = "name" | "mobile" | "email" | "message";

type Props = {
  propertyId?: string;
  propertyTitle?: string;
  compact?: boolean;
};

export function EnquiryForm({ propertyId, propertyTitle, compact }: Props) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const validateField = (field: Field, value: string) => {
    const result = schema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const update = (field: Field, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) validateField(field, value);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
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
    const { error } = await supabase.from("property_inquiries").insert({
      property_id: propertyId ?? null,
      property_title: propertyTitle ?? null,
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      message: parsed.data.message ?? null,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Could not send your enquiry. Please check your connection and try again.");
      return;
    }
    toast.success("Enquiry received — an advisor will call you shortly.");
    setForm({ name: "", mobile: "", email: "", message: "" });
    setErrors({});
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent/10 p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-accent" />
        <h3 className="mt-3 font-display text-xl">Thank you — we have your details</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A Prime Pure advisor will call you within one working hour
          {propertyTitle ? ` about ${propertyTitle}` : ""}. Please keep your phone handy.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="eq-name">Full name</Label>
        <Input
          id="eq-name"
          value={form.name}
          maxLength={80}
          placeholder="e.g. Rahul Sharma"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "eq-name-error" : undefined}
          onBlur={(e) => validateField("name", e.target.value)}
          onChange={(e) => update("name", e.target.value)}
        />
        {errors.name && (
          <p id="eq-name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-1.5">
          <Label htmlFor="eq-mobile">Mobile number</Label>
          <Input
            id="eq-mobile"
            value={form.mobile}
            maxLength={20}
            inputMode="tel"
            className="tabular-nums"
            placeholder="e.g. 98765 43210"
            aria-invalid={!!errors.mobile}
            aria-describedby={errors.mobile ? "eq-mobile-error" : undefined}
            onBlur={(e) => validateField("mobile", e.target.value)}
            onChange={(e) => update("mobile", e.target.value)}
          />
          {errors.mobile && (
            <p id="eq-mobile-error" className="text-xs text-destructive">
              {errors.mobile}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eq-email">Email</Label>
          <Input
            id="eq-email"
            value={form.email}
            maxLength={160}
            inputMode="email"
            placeholder="e.g. rahul@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "eq-email-error" : undefined}
            onBlur={(e) => validateField("email", e.target.value)}
            onChange={(e) => update("email", e.target.value)}
          />
          {errors.email && (
            <p id="eq-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eq-message">Your requirement</Label>
        <Textarea
          id="eq-message"
          value={form.message}
          maxLength={600}
          rows={compact ? 3 : 4}
          placeholder={
            propertyTitle
              ? `I would like a site visit for ${propertyTitle}.`
              : "Budget, preferred locality, timeline…"
          }
          aria-invalid={!!errors.message}
          onChange={(e) => update("message", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{form.message.length}/600 characters</p>
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Request a callback
      </Button>
      <p className="text-xs text-muted-foreground">
        By submitting you agree to be contacted by a Prime Pure advisor about this requirement.
      </p>
    </form>
  );
}
