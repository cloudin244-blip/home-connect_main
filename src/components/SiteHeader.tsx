import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Phone, X, ShieldCheck } from "lucide-react";

import logo from "@/assets/prime-pure-logo.asset.json";
import { settingsQuery, WHATSAPP_FALLBACK } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { label: "Home", to: "/", hash: undefined },
  { label: "Buy", to: "/properties", search: { intent: "buy" } },
  { label: "Rent", to: "/properties", search: { intent: "rent" } },
  { label: "Projects", to: "/", hash: "showcase" },
  { label: "Services", to: "/", hash: "services" },
  { label: "About", to: "/", hash: "about" },
  { label: "Contact", to: "/contact", hash: undefined },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const { data: settings } = useQuery(settingsQuery);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const phone = settings?.["phone"] ?? "+91 96606 19500";
  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="hidden border-b border-border/60 bg-navy py-2 text-primary-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs tracking-wide">
          <span className="opacity-80">RERA-compliant listings · Zero brokerage on select projects</span>
          <div className="flex items-center gap-5">
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-accent">
              <Phone className="size-3.5" /> {phone}
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="hover:text-accent">
              WhatsApp Community
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="Prime Pure Real Estate logo" className="h-12 w-12 rounded-sm object-cover" />
          <span className="leading-none">
            <span className="block font-display text-lg tracking-tight">PRIME PURE</span>
            <span className="block text-[0.6rem] tracking-[0.3em] text-muted-foreground">REAL ESTATE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={"hash" in item ? item.hash : undefined}
              search={"search" in item ? (item.search as never) : undefined}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="outline" size="sm">
            <Link to={signedIn ? "/admin" : "/auth"}>
              <ShieldCheck className="size-4" /> {signedIn ? "Admin" : "Team login"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href={whatsapp} target="_blank" rel="noreferrer">
              Join community
            </a>
          </Button>
        </div>

        <button
          className="rounded-sm border border-border p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-3">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={"hash" in item ? item.hash : undefined}
                search={"search" in item ? (item.search as never) : undefined}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm"
              >
                {item.label}
              </Link>
            ))}
            <Link to={signedIn ? "/admin" : "/auth"} onClick={() => setOpen(false)} className="py-3 text-sm">
              {signedIn ? "Admin dashboard" : "Team login"}
            </Link>
            <Button asChild className="mt-2">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                Join WhatsApp community
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
