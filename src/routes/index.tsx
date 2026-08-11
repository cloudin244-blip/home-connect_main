import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Compass,
  FileCheck2,
  Globe2,
  Handshake,
  MapPin,
  Play,
  Ruler,
  Bath,
  BedDouble,
} from "lucide-react";

import heroVideo from "@/assets/hero-building.mp4.asset.json";
import agent1 from "@/assets/agent-1.mp4.asset.json";
import agent2 from "@/assets/agent-2.mp4.asset.json";
import agent3 from "@/assets/agent-3.mp4.asset.json";
import agent4 from "@/assets/agent-4.mp4.asset.json";
import agent5 from "@/assets/agent-5.mp4.asset.json";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceBot } from "@/components/VoiceBot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationMap } from "@/components/LocationMap";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PropertyCard } from "@/components/PropertyCard";
import {
  CONTACT_FALLBACK,
  propertiesQuery,
  settingsQuery,
  videosQuery,
  WHATSAPP_FALLBACK,
} from "@/lib/site-data";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(propertiesQuery).catch((err) => console.error("Prefetch properties failed:", err)),
      context.queryClient.ensureQueryData(videosQuery).catch((err) => console.error("Prefetch videos failed:", err)),
      context.queryClient.ensureQueryData(settingsQuery).catch((err) => console.error("Prefetch settings failed:", err)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Prime Pure Real Estate | Pure Values. Prime Living." },
      {
        name: "description",
        content:
          "Buy, rent or invest with Prime Pure Real Estate. Verified apartments, villas, plots and offices, advisor-led site visits and a WhatsApp community for early access.",
      },
      { property: "og:title", content: "Prime Pure Real Estate | Pure Values. Prime Living." },
      {
        property: "og:description",
        content:
          "Verified listings, transparent pricing and advisors who stay with you from first visit to final key.",
      },
    ],
  }),
  component: Home,
});

const FALLBACK_AGENT_VIDEOS = [
  { title: "First-home walkthrough", description: "Advisor guiding a young couple through a sunlit 3BHK.", video_url: agent1.url },
  { title: "Closing the deal", description: "Paperwork, keys and a handshake in our advisory lounge.", video_url: agent2.url },
  { title: "Project consultation", description: "Layout planning session with a scale model of the township.", video_url: agent3.url },
  { title: "Under-construction visit", description: "On-site penthouse inspection with the buyers.", video_url: agent4.url },
  { title: "Handover day", description: "A family receiving keys to their new villa.", video_url: agent5.url },
];

const SERVICES = [
  { icon: Building2, title: "Residential sales", body: "Apartments, villas and penthouses across prime corridors, shortlisted to your budget and lifestyle." },
  { icon: Compass, title: "Rentals & leasing", body: "Tenant-ready homes and grade-A offices with verified landlords and clean agreements." },
  { icon: Banknote, title: "Home loan desk", body: "Pre-approved offers from partner banks, with EMI planning before you commit." },
  { icon: FileCheck2, title: "Legal & RERA checks", body: "Title verification, approvals and RERA status audited before any token payment." },
  { icon: Ruler, title: "Valuation & advisory", body: "Data-backed pricing so you never overpay — or undersell your own asset." },
  { icon: Globe2, title: "NRI investment desk", body: "Remote site tours, power-of-attorney support and repatriation guidance." },
];

const STATS = [
  { value: "1,200+", label: "Families settled" },
  { value: "₹850 Cr+", label: "Property transacted" },
  { value: "42", label: "Partner developers" },
  { value: "4.9/5", label: "Client rating" },
];

function Home() {
  const { data: properties } = useQuery(propertiesQuery);
  const { data: videos } = useQuery(videosQuery);
  const { data: settings } = useQuery(settingsQuery);

  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;
  const heroTitle = settings?.["hero_title"] ?? "Pure Values. Prime Living.";
  const heroSubtitle =
    settings?.["hero_subtitle"] ??
    "Handpicked residences, transparent pricing and advisors who stay with you from first visit to final key.";

  const cmsHero = videos?.find((v) => v.section === "hero" && v.published);
  const cmsAgents = (videos ?? []).filter((v) => v.section === "agent" && v.published);
  const agentVideos = cmsAgents.length ? cmsAgents : FALLBACK_AGENT_VIDEOS;
  const featured = (properties ?? []).filter((p) => p.published);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* HERO — building creation video */}
        <section className="relative isolate overflow-hidden bg-navy-deep">
          <video
            className="h-[64vh] w-full object-cover md:h-[88vh]"
            src={cmsHero?.video_url ?? heroVideo.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-deep/40 via-transparent to-navy-deep/70" />
        </section>

        {/* HERO COPY — below the video */}
        <section className="surface-navy">
          <div className="mx-auto max-w-7xl px-6 py-16 text-primary-foreground md:py-20">
            <p className="text-eyebrow text-accent">Prime Pure Real Estate</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] md:text-7xl">
              <span className="text-gold-gradient">{heroTitle}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base opacity-85 md:text-lg">{heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold">
                <Link to="/properties" search={{ intent: "buy" }}>
                  Explore listings <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  Join WhatsApp community
                </a>
              </Button>
            </div>
          </div>
        </section>


        {/* AGENT VIDEOS — center of the page */}
        <section id="videos" className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-eyebrow">Real conversations</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Our advisors, dealing with real clients
            </h2>
            <p className="mt-4 text-muted-foreground">
              Five unscripted moments from site visits, consultations and handovers — so you know
              exactly how we work before you meet us.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agentVideos.slice(0, 5).map((video, index) => (
              <article
                key={video.title + index}
                className={`group overflow-hidden rounded-lg border border-border bg-card shadow-card ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <video
                  className="aspect-video w-full object-cover"
                  src={video.video_url}
                  controls
                  playsInline
                  preload="metadata"
                />
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <Play className="size-3.5 text-accent" />
                    <h3 className="font-display text-xl">{video.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{video.description}</p>
                </div>
              </article>
            ))}
          </div>

          {/* STATS — moved below videos */}
          <div className="mt-16 border-t border-border pt-12">
            <dl className="grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-4xl font-bold tabular-nums tracking-tight text-accent md:text-5xl">
                    {stat.value}
                  </dt>

                  <dd className="mt-3 text-sm font-medium tracking-wide text-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* LISTINGS */}
        <section id="showcase" className="border-y border-border bg-secondary/50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-eyebrow">Curated inventory</p>
                <h2 className="mt-3 font-display text-4xl md:text-5xl">Featured properties</h2>
              </div>
              <Button asChild variant="outline">
                <Link to="/properties" search={{ intent: "all" }}>
                  View all listings <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-eyebrow">What we handle</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">End-to-end property services</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="bg-card p-7">
                <service.icon className="size-6 text-accent" />
                <h3 className="mt-5 font-display text-xl">{service.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{service.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="surface-navy py-24">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2">
            <div>
              <p className="text-eyebrow text-accent">Since 2014</p>
              <h2 className="mt-3 font-display text-4xl md:text-5xl">
                Built on one promise: nothing hidden
              </h2>
              <p className="mt-6 text-sm leading-relaxed opacity-80">
                Prime Pure Real Estate began with a simple frustration — buyers were shown glossy
                brochures and hidden charges. We flipped it. Every listing on this portal carries a
                verified title, a RERA status, a real price band and an advisor who answers the phone
                after the sale.
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  "Verified inventory only — no unapproved projects, ever.",
                  "One advisor stays with you from shortlist to registry.",
                  "Full cost sheet upfront, including stamp duty and GST.",
                  "Post-possession support: interiors, rentals and resale.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="opacity-85">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-6 rounded-lg border border-primary-foreground/15 p-8">
              <Handshake className="size-8 text-accent" />
              <p className="font-display text-2xl leading-snug">
                "They talked us out of a property we loved because the approvals were incomplete.
                That is when we knew we had the right advisors."
              </p>
              <p className="text-xs tracking-wide opacity-70">
                A Prime Pure client, Bengaluru
              </p>
              <Button asChild variant="outline" className="w-fit">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  Join our WhatsApp community
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* OFFICES & MAPS */}
        <section id="locations" className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-eyebrow">Visit us</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Two offices, one standard</h2>
            <p className="mt-4 text-muted-foreground">
              Walk in for a consultation at our Bangalore or Noida office — or ask us to come to you.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <LocationMap
              title="Bangalore — Electronic City Phase-2"
              address={settings?.["address_2"] ?? CONTACT_FALLBACK.address2}
              query={settings?.["map_query_2"] ?? CONTACT_FALLBACK.map2}
            />
            <LocationMap
              title="Noida — Sector 62"
              address={settings?.["address"] ?? CONTACT_FALLBACK.address}
              query={settings?.["map_query_1"] ?? CONTACT_FALLBACK.map1}
            />
          </div>
        </section>

        {/* ENQUIRY */}
        <section id="enquire" className="border-y border-border bg-secondary/50 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-eyebrow">Talk to an advisor</p>
              <h2 className="mt-3 font-display text-4xl md:text-5xl">Tell us what you are looking for</h2>
              <p className="mt-4 text-muted-foreground">
                Share your budget and preferred locality. We revert within one working day with a
                shortlist, a full cost sheet and site-visit slots — no spam, no pressure.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Sales desk</dt>
                  <dd className="font-display text-2xl tabular-nums text-accent">
                    {settings?.["phone"] ?? CONTACT_FALLBACK.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Alternate line</dt>
                  <dd className="font-display text-2xl tabular-nums text-accent">
                    {settings?.["phone_2"] ?? CONTACT_FALLBACK.phone2}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-base">{settings?.["email"] ?? CONTACT_FALLBACK.email}</dd>
                </div>
              </dl>
            </div>
            <div className="w-full max-w-xl mx-auto rounded-lg border border-border bg-card p-7 shadow-card lg:max-w-none lg:mx-0">
              <EnquiryForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
          <p className="text-eyebrow">Good to know</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Frequently asked questions</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {[
              {
                q: "Do you charge brokerage?",
                a: "On most developer-tied projects there is zero brokerage for the buyer. For resale and rentals we share the exact fee in writing before you commit.",
              },
              {
                q: "Are the listings RERA-verified?",
                a: "Yes. Every project on this portal carries a RERA number and a verified title. We share the approval set before any token payment.",
              },
              {
                q: "Can I book a site visit on a weekend?",
                a: "Absolutely. Weekend and evening visits are our busiest slots — request a callback and we will arrange pickup where possible.",
              },
              {
                q: "Do you help NRI buyers?",
                a: "We run remote video tours, handle power-of-attorney documentation and guide repatriation of sale proceeds.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-xl">{item.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
      <VoiceBot />
    </div>
  );
}
