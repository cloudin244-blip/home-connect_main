import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  BadgeCheck,
  Building2,
  CalendarClock,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceBot } from "@/components/VoiceBot";
import { EnquiryForm } from "@/components/EnquiryForm";
import { LocationMap } from "@/components/LocationMap";
import { PropertyCard } from "@/components/PropertyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CONTACT_FALLBACK,
  formatINR,
  propertiesQuery,
  propertyBySlugQuery,
  settingsQuery,
  telHref,
  WHATSAPP_FALLBACK,
} from "@/lib/site-data";

export const Route = createFileRoute("/property/$slug")({
  head: ({ params }) => {
    const name = params.slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${name} | Prime Pure Real Estate` },
        {
          name: "description",
          content: `${name} — price, floor details, amenities, location map and site-visit enquiry with a Prime Pure advisor.`,
        },
        { property: "og:title", content: `${name} | Prime Pure Real Estate` },
        {
          property: "og:description",
          content: `See photos, pricing, amenities and location for ${name}, plus book a site visit.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PropertyDetail,
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="font-display text-3xl">We could not load this property</h1>
      <p className="mt-3 text-muted-foreground">Please try again or browse all listings.</p>
      <Button asChild className="mt-6">
        <Link to="/properties" search={{ intent: "all" }}>Back to listings</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="font-display text-3xl">Property not found</h1>
      <p className="mt-3 text-muted-foreground">This listing may have been sold or unpublished.</p>
      <Button asChild className="mt-6">
        <Link to="/properties" search={{ intent: "all" }}>Browse listings</Link>
      </Button>
    </div>
  ),
});

function PropertyDetail() {
  const { slug } = Route.useParams();
  const { data: property, isLoading } = useQuery(propertyBySlugQuery(slug));
  const { data: all } = useQuery(propertiesQuery);
  const { data: settings } = useQuery(settingsQuery);
  const [active, setActive] = useState(0);

  const phone = settings?.["phone"] ?? CONTACT_FALLBACK.phone;
  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-7xl px-6 py-32 text-sm text-muted-foreground">Loading property…</p>
        <SiteFooter />
      </div>
    );
  }

  if (!property || !property.published) throw notFound();

  const gallery = property.gallery.length
    ? property.gallery
    : property.image_url
      ? [property.image_url]
      : [];
  const price = property.price_value ? formatINR(property.price_value) : property.price;
  const isRent = property.status.toLowerCase().includes("rent");
  const similar = (all ?? [])
    .filter((p) => p.published && p.id !== property.id && p.city === property.city)
    .slice(0, 3);

  const facts = [
    { icon: BedDouble, label: "Bedrooms", value: property.bedrooms ? `${property.bedrooms} BHK` : "—" },
    { icon: Bath, label: "Bathrooms", value: property.bathrooms ? `${property.bathrooms}` : "—" },
    { icon: Ruler, label: "Area", value: property.area ?? "—" },
    { icon: Building2, label: "Type", value: property.property_type },
    { icon: CalendarClock, label: "Possession", value: property.possession ?? "On request" },
    { icon: ShieldCheck, label: "RERA", value: property.rera_id ?? "On request" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10 pb-28 lg:pb-10">
        <Link
          to="/properties"
          search={{ intent: "all" }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All listings
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{property.status}</Badge>
              <Badge variant="secondary">{property.property_type}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-5xl">{property.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 text-accent" /> {property.location}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl tabular-nums text-accent">{price}</p>
            <p className="text-xs tracking-wide text-muted-foreground">
              {isRent ? "per month + maintenance" : "all inclusive, excluding registry"}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div>
            {/* GALLERY */}
            {gallery.length > 0 && (
              <div>
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={gallery[active]}
                    alt={`${property.title} photo ${active + 1}`}
                    width={1280}
                    height={854}
                    className="aspect-[3/2] w-full object-cover"
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {gallery.map((src, index) => (
                      <button
                        key={src + index}
                        onClick={() => setActive(index)}
                        aria-label={`Show photo ${index + 1}`}
                        className={`overflow-hidden rounded-md border-2 transition-colors ${
                          index === active ? "border-accent" : "border-transparent"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${property.title} thumbnail ${index + 1}`}
                          loading="lazy"
                          width={320}
                          height={214}
                          className="aspect-[3/2] w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FACTS */}
            <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-card p-5">
                  <fact.icon className="size-4 text-accent" />
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                    {fact.label}
                  </p>
                  <p className="mt-1 font-medium tabular-nums">{fact.value}</p>
                </div>
              ))}
            </div>

            {property.description && (
              <section className="mt-12">
                <h2 className="font-display text-2xl">About this property</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{property.description}</p>
              </section>
            )}

            {property.highlights.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl">Project highlights</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {property.highlights.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {property.amenities.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl">Amenities</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-12">
              <h2 className="font-display text-2xl">Location</h2>
              <LocationMap
                className="mt-4"
                title={property.title}
                address={property.location}
                query={property.map_query ?? property.location}
              />
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-2xl">Enquire about this property</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Share your details and an advisor will call you with the full cost sheet and site-visit
                slots.
              </p>
              <div className="mt-5">
                <EnquiryForm propertyId={property.id} propertyTitle={property.title} compact />
              </div>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <a href={telHref(phone)} className="flex items-center gap-2 hover:text-accent">
                  <Phone className="size-4 text-accent" /> {phone}
                </a>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-accent"
                >
                  <MessageCircle className="size-4 text-accent" /> Join WhatsApp community
                </a>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl">More in {property.city ?? "this city"}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MOBILE STICKY ACTIONS */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button asChild className="flex-1">
          <a href={telHref(phone)}>
            <Phone className="size-4" /> Call advisor
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </Button>
      </div>

      <SiteFooter />
      <VoiceBot />
    </div>
  );
}
