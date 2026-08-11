import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceBot } from "@/components/VoiceBot";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, propertiesQuery } from "@/lib/site-data";

type SearchParams = { intent: string };

export const Route = createFileRoute("/properties")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    intent: typeof search["intent"] === "string" ? search["intent"] : "all",
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(propertiesQuery).catch((err) => console.error("Prefetch properties failed:", err));
  },
  head: () => ({
    meta: [
      { title: "Properties for sale & rent | Prime Pure Real Estate" },
      {
        name: "description",
        content:
          "Search verified apartments, villas, plots, penthouses and offices by type, budget and location with Prime Pure Real Estate.",
      },
      { property: "og:title", content: "Properties for sale & rent | Prime Pure Real Estate" },
      {
        property: "og:description",
        content: "Verified listings with transparent pricing, RERA checks and advisor-led site visits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertiesPage,
});

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

const MAX_BUDGET = 100000000; // ₹10 Cr

function PropertiesPage() {
  const { intent } = Route.useSearch();
  const { data: properties, isLoading } = useQuery(propertiesQuery);
  const [term, setTerm] = useState("");
  const [type, setType] = useState("All");
  const [city, setCity] = useState("All");
  const [beds, setBeds] = useState("Any");
  const [budget, setBudget] = useState<number[]>([0, MAX_BUDGET]);
  const [sort, setSort] = useState<string>("recommended");
  const [showFilters, setShowFilters] = useState(true);

  const published = useMemo(() => (properties ?? []).filter((p) => p.published), [properties]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(published.map((p) => p.property_type)))],
    [published],
  );
  const cities = useMemo(
    () => ["All", ...Array.from(new Set(published.map((p) => p.city ?? p.location)))],
    [published],
  );

  const list = useMemo(() => {
    const filtered = published.filter((p) => {
      if (intent === "rent" && !p.status.toLowerCase().includes("rent")) return false;
      if (intent === "buy" && !p.status.toLowerCase().includes("sale")) return false;
      if (type !== "All" && p.property_type !== type) return false;
      if (city !== "All" && (p.city ?? p.location) !== city) return false;
      if (beds !== "Any" && p.bedrooms < Number(beds)) return false;
      const value = p.price_value ?? 0;
      const isRent = p.status.toLowerCase().includes("rent");
      if (!isRent && value > 0 && (value < budget[0]! || value > budget[1]!)) return false;
      const q = term.trim().toLowerCase();
      if (!q) return true;
      return `${p.title} ${p.location} ${p.city ?? ""} ${p.property_type}`.toLowerCase().includes(q);
    });

    if (sort === "price-asc") return [...filtered].sort((a, b) => a.price_value - b.price_value);
    if (sort === "price-desc") return [...filtered].sort((a, b) => b.price_value - a.price_value);
    return filtered;
  }, [published, intent, type, city, beds, budget, term, sort]);

  const reset = () => {
    setTerm("");
    setType("All");
    setCity("All");
    setBeds("Any");
    setBudget([0, MAX_BUDGET]);
    setSort("recommended");
  };

  const heading =
    intent === "rent" ? "Homes & offices for rent" : intent === "buy" ? "Properties for sale" : "All listings";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-eyebrow">Inventory</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{heading}</h1>
        <p className="mt-3 text-muted-foreground">
          {isLoading ? "Loading listings…" : `${list.length} verified ${list.length === 1 ? "property" : "properties"} match your search.`}
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                maxLength={80}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search by project, locality or city"
                className="pl-9"
                aria-label="Search listings"
              />
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
            <Button size="sm" variant="ghost" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal className="size-4" /> Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Property type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Select value={beds} onValueChange={setBeds}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Any", "1", "2", "3", "4"].map((b) => (
                      <SelectItem key={b} value={b}>{b === "Any" ? "Any" : `${b}+ BHK`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Budget</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatINR(budget[0]!)} – {budget[1]! >= MAX_BUDGET ? "₹10 Cr+" : formatINR(budget[1]!)}
                  </span>
                </div>
                <Slider
                  value={budget}
                  min={0}
                  max={MAX_BUDGET}
                  step={500000}
                  onValueChange={setBudget}
                  aria-label="Budget range"
                />
              </div>

              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="size-4" /> Reset filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="mt-16 text-sm text-muted-foreground">Loading listings…</p>
        ) : list.length === 0 ? (
          <div className="mt-16 rounded-lg border border-border bg-card p-10 text-center">
            <p className="font-display text-2xl">No listings match these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Widen your budget or reset the filters — or tell our assistant what you need.
            </p>
            <Button className="mt-5" variant="outline" onClick={reset}>
              <RotateCcw className="size-4" /> Reset filters
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <VoiceBot />
    </div>
  );
}
