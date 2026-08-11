import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceBot } from "@/components/VoiceBot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsQuery, WHATSAPP_FALLBACK, createLeadFn } from "@/lib/site-data";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  mobile: z.string().trim().regex(/^[+]?[0-9][0-9\s-]{7,17}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email").max(160),
  notes: z.string().trim().max(1000).optional(),
});

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(settingsQuery).catch((err) => console.error("Prefetch settings failed:", err));
  },
  head: () => ({
    meta: [
      { title: "Contact Prime Pure Real Estate | Book a site visit" },
      {
        name: "description",
        content:
          "Talk to a Prime Pure advisor. Share your requirement, book a site visit or join our WhatsApp community for early listing access.",
      },
      { property: "og:title", content: "Contact Prime Pure Real Estate" },
      {
        property: "og:description",
        content: "Book a site visit or join the Prime Pure WhatsApp community.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useQuery(settingsQuery);
  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;
  const phone = settings?.["phone"] ?? "+91 96606 19500";
  const email = settings?.["email"] ?? "k96606195@gmail.com";
  const address = settings?.["address"] ?? "Prime Pure Real Estate, Noida, India";

  const [form, setForm] = useState({ name: "", mobile: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSaving(true);
    try {
      await createLeadFn({
        data: {
          name: parsed.data.name,
          mobile: parsed.data.mobile,
          email: parsed.data.email,
          notes: parsed.data.notes ?? null,
          source: "contact_form",
        }
      });
      setSaving(false);
    } catch (err) {
      console.error(err);
      setSaving(false);
      toast.error("Could not send your enquiry. Please try again.");
      return;
    }
    toast.success("Thank you — an advisor will call you shortly.");
    setForm({ name: "", mobile: "", email: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-eyebrow">Get in touch</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Let's find your prime address</h1>
          <p className="mt-4 text-muted-foreground">
            Share your requirement and budget. An advisor reviews it personally and comes back with a
            shortlist — not a sales pitch.
          </p>

          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-accent" /> {address}
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-accent" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-accent">{phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${email}`} className="hover:text-accent">{email}</a>
            </li>
          </ul>

          <Button asChild className="mt-8">
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> Join WhatsApp community
            </a>
          </Button>
        </div>

        <form onSubmit={submit} className="w-full max-w-xl mx-auto space-y-5 rounded-lg border border-border bg-card p-7 shadow-card lg:max-w-none lg:mx-0">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input id="mobile" inputMode="tel" value={form.mobile} maxLength={20} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" inputMode="email" value={form.email} maxLength={160} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">What are you looking for?</Label>
            <Textarea id="notes" rows={4} value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" />} Send enquiry
          </Button>
        </form>
      </main>
      <SiteFooter />
      <VoiceBot />
    </div>
  );
}
