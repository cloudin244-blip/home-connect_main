import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^[+]?[0-9][0-9\s-]{7,17}$/, "Please enter a valid mobile number"),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  message: z.string().trim().max(600).optional(),
});

type Props = {
  propertyId?: string;
  propertyTitle?: string;
  compact?: boolean;
};

export function EnquiryForm({ propertyId, propertyTitle, compact }: Props) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
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
      toast.error("Could not send your enquiry. Please try again.");
      return;
    }
    toast.success("Enquiry received — an advisor will call you shortly.");
    setForm({ name: "", mobile: "", email: "", message: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="eq-name">Full name</Label>
        <Input
          id="eq-name"
          value={form.name}
          maxLength={80}
          required
          placeholder="e.g. Rahul Sharma"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-1.5">
          <Label htmlFor="eq-mobile">Mobile number</Label>
          <Input
            id="eq-mobile"
            value={form.mobile}
            maxLength={20}
            inputMode="tel"
            required
            placeholder="e.g. 98765 43210"
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eq-email">Email</Label>
          <Input
            id="eq-email"
            value={form.email}
            maxLength={160}
            inputMode="email"
            required
            placeholder="e.g. rahul@email.com"
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
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
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
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
