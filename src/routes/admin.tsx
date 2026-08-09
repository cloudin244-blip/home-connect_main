import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LeadsDashboard } from "@/components/admin/LeadsDashboard";
import { propertiesQuery, settingsQuery, videosQuery } from "@/lib/site-data";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin console | Prime Pure Real Estate" },
      {
        name: "description",
        content: "Manage property listings, showcase videos, site settings and captured leads.",
      },
      { property: "og:title", content: "Admin console | Prime Pure Real Estate" },
      { property: "og:description", content: "Internal console for the Prime Pure team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Role = "super_admin" | "admin" | null;

const propertySchema = z.object({
  title: z.string().trim().min(3).max(140),
  location: z.string().trim().min(2).max(140),
  price: z.string().trim().min(1).max(60),
  property_type: z.string().trim().min(2).max(60),
  status: z.string().trim().min(2).max(60),
  bedrooms: z.number().int().min(0).max(40),
  bathrooms: z.number().int().min(0).max(40),
  area: z.string().trim().max(60).optional(),
  image_url: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(data.user.email ?? "");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (!active) return;
      const list = (roles ?? []).map((r) => r.role);
      setRole(list.includes("super_admin") ? "super_admin" : list.includes("admin") ? "admin" : null);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const { data: properties } = useQuery({ ...propertiesQuery, enabled: !!role });
  const { data: videos } = useQuery({ ...videosQuery, enabled: !!role });
  const { data: settings } = useQuery({ ...settingsQuery, enabled: !!role });

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl">No admin access</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {email} is signed in but has not been granted admin rights. Ask the super admin to add you
          from the Team tab.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="font-display text-2xl">Admin console</h1>
            <p className="text-xs text-muted-foreground">
              {email} · <Badge variant="secondary">{role.replace("_", " ")}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
              View site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                qc.clear();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {role === "super_admin" && <TabsTrigger value="team">Team</TabsTrigger>}
          </TabsList>

          {/* LEADS */}
          <TabsContent value="leads" className="mt-6">
            <LeadsDashboard />
          </TabsContent>


          {/* PROPERTIES */}
          <TabsContent value="properties" className="mt-6 space-y-6">
            <NewPropertyForm onDone={() => qc.invalidateQueries({ queryKey: ["properties"] })} />
            <div className="grid gap-4 md:grid-cols-2">
              {(properties ?? []).map((property) => (
                <div key={property.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg">{property.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {property.location} · {property.price} · {property.status}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Delete listing"
                      onClick={async () => {
                        const { error } = await supabase.from("properties").delete().eq("id", property.id);
                        if (error) { toast.error(error.message); return; }
                        toast.success("Listing removed");
                        qc.invalidateQueries({ queryKey: ["properties"] });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Switch
                      checked={property.published}
                      onCheckedChange={async (checked) => {
                        const { error } = await supabase
                          .from("properties")
                          .update({ published: checked })
                          .eq("id", property.id);
                        if (error) { toast.error(error.message); return; }
                        qc.invalidateQueries({ queryKey: ["properties"] });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {property.published ? "Published" : "Hidden"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* VIDEOS */}
          <TabsContent value="videos" className="mt-6 space-y-4">
            {(videos ?? []).map((video) => (
              <div key={video.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
                <div>
                  <h3 className="font-display text-lg">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {video.section} · {video.video_url.slice(0, 60)}…
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={video.published}
                    onCheckedChange={async (checked) => {
                      const { error } = await supabase
                        .from("site_videos")
                        .update({ published: checked })
                        .eq("id", video.id);
                      if (error) { toast.error(error.message); return; }
                      qc.invalidateQueries({ queryKey: ["site_videos"] });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {video.published ? "Live" : "Hidden"}
                  </span>
                </div>
              </div>
            ))}
            {(videos ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No CMS videos yet — the site is using the built-in showcase videos.
              </p>
            )}
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(settings ?? {}).map(([key, value]) => (
                <SettingField key={key} settingKey={key} value={value} />
              ))}
            </div>
          </TabsContent>

          {role === "super_admin" && (
            <TabsContent value="team" className="mt-6">
              <AddAdminForm />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function SettingField({ settingKey, value }: { settingKey: string; value: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Label htmlFor={settingKey} className="text-xs uppercase tracking-wide text-muted-foreground">
        {settingKey.replace(/_/g, " ")}
      </Label>
      <Textarea
        id={settingKey}
        rows={2}
        className="mt-2"
        maxLength={800}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button
        size="sm"
        className="mt-3"
        disabled={saving || draft === value}
        onClick={async () => {
          setSaving(true);
          const { error } = await supabase
            .from("site_settings")
            .update({ value: draft })
            .eq("key", settingKey);
          setSaving(false);
          if (error) { toast.error(error.message); return; }
          toast.success("Saved");
          qc.invalidateQueries({ queryKey: ["site_settings"] });
        }}
      >
        Save
      </Button>
    </div>
  );
}

function NewPropertyForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    property_type: "Apartment",
    status: "For Sale",
    bedrooms: "3",
    bathrooms: "2",
    area: "",
    image_url: "",
    description: "",
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add listing
      </Button>
    );
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "location", label: "Location" },
    { key: "price", label: "Price" },
    { key: "property_type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "area", label: "Area" },
    { key: "image_url", label: "Image URL" },
  ];

  return (
    <form
      className="rounded-lg border border-border bg-card p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = propertySchema.safeParse({
          ...form,
          bedrooms: Number(form.bedrooms) || 0,
          bathrooms: Number(form.bathrooms) || 0,
        });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Check the listing details");
          return;
        }
        setSaving(true);
        const { error } = await supabase.from("properties").insert({
          ...parsed.data,
          area: parsed.data.area || null,
          image_url: parsed.data.image_url || null,
          description: parsed.data.description || null,
          published: true,
        });
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Listing added");
        setOpen(false);
        onDone();
      }}
    >
      <h3 className="font-display text-xl">New listing</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              maxLength={500}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          maxLength={1000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save listing
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="max-w-xl rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-xl">Grant admin access</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The person must sign up first at /auth. Then enter their email here to promote them to admin —
        they get full front-end editing rights over listings, videos and settings.
      </p>
      <div className="mt-5 space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          inputMode="email"
          maxLength={160}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button
        className="mt-4"
        disabled={busy}
        onClick={async () => {
          const parsed = z.string().trim().email().max(160).safeParse(email);
          if (!parsed.success) {
            toast.error("Enter a valid email");
            return;
          }
          setBusy(true);
          const { data: profile, error: lookupError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", parsed.data.toLowerCase())
            .maybeSingle();
          if (lookupError) {
            setBusy(false);
            toast.error(lookupError.message);
            return;
          }
          if (!profile) {
            setBusy(false);
            toast.error("No account found with that email. Ask them to sign up first.");
            return;
          }
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: profile.id, role: "admin" });
          setBusy(false);
          if (error) {
            toast.error(error.message.includes("duplicate") ? "Already an admin" : error.message);
            return;
          }
          toast.success("Admin access granted");
          setEmail("");
        }}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Add admin
      </Button>
    </div>
  );
}
