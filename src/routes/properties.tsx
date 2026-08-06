import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bath, BedDouble, MapPin, Ruler, Search } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceBot } from "@/components/VoiceBot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { propertiesQuery } from "@/lib/site-data";

type Search = { intent: string };

export const Route = createFileRoute("/properties")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    intent: typeof search["intent"] === "string" ? search["intent"] : "all",
  }),
  head: () => ({
    meta: [
      { title: "Properties for sale & rent | Prime Pure Real Estate" },
      {
        name: "description",
        content:
          "Browse verified apartments, villas, plots, penthouses and offices for sale and rent with Prime Pure Real Estate.",
      },
      { property: "og:title", content: "Properties for sale & rent | Prime Pure Real Estate" },
      {
        property: "og:description",
        content: "Verified listings with transparent pricing, RERA checks and advisor-led site visits.",
      },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { intent } = Route.useSearch();
  const { data: properties, isLoading } = useQuery(propertiesQuery);
  const [term, setTerm] = useState("");
  const [type, setType] = useState("All");

  const types = useMemo(
    () => ["All", ...new Set((properties ?? []).map((p) => p.property_type))],
    [properties],
  );

  const list = (properties ?? []).filter((p) => {
    if (!p.published) return false;
    if (intent === "rent" && !p.status.toLowerCase().includes("rent")) return false;
    if (intent === "buy" && !p.status.toLowerCase().includes("sale")) return false;
    if (type !== "All" && p.property_type !== type) return false;
    const q = term.trim().toLowerCase();
    if (!q) return true;
    return `${p.title} ${p.location} ${p.property_type}`.toLowerCase().includes(q);
  });

  const heading = intent === "rent" ? "Homes & offices for rent" : intent === "buy" ? "Properties for sale" : "All listings";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-eyebrow">Inventory</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{heading}</h1>

        <div className="mt-8 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              maxLength={80}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by locality, project or type"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === type ? "default" : "outline"}
                onClick={() => setType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant={intent === "buy" ? "default" : "outline"}>
              <Link to="/properties" search={{ intent: "buy" }}>Buy</Link>
            </Button>
            <Button asChild size="sm" variant={intent === "rent" ? "default" : "outline"}>
              <Link to="/properties" search={{ intent: "rent" }}>Rent</Link>
            </Button>
            <Button asChild size="sm" variant={intent === "all" ? "default" : "outline"}>
              <Link to="/properties" search={{ intent: "all" }}>All</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-16 text-sm text-muted-foreground">Loading listings…</p>
        ) : list.length === 0 ? (
          <p className="mt-16 text-sm text-muted-foreground">
            No listings match this filter yet. Try another search or talk to our assistant.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((property) => (
              <article
                key={property.id}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                  {property.image_url && (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      loading="lazy"
                      width={1280}
                      height={854}
                      className="size-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  )}
                  <Badge className="absolute left-4 top-4">{property.status}</Badge>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl">{property.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 text-accent" /> {property.location}
                  </p>
                  {property.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{property.description}</p>
                  )}
                  <p className="mt-4 font-display text-2xl text-accent">{property.price}</p>
                  <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    {property.bedrooms > 0 && (
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="size-3.5" /> {property.bedrooms} Beds
                      </span>
                    )}
                    {property.bathrooms > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Bath className="size-3.5" /> {property.bathrooms} Baths
                      </span>
                    )}
                    {property.area && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="size-3.5" /> {property.area}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <VoiceBot />
    </div>
  );
}
