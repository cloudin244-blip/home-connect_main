import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";

import logo from "@/assets/prime-pure-logo.asset.json";
import {
  CONTACT_FALLBACK,
  mapLinkUrl,
  settingsQuery,
  telHref,
  WHATSAPP_FALLBACK,
} from "@/lib/site-data";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);
  const phone = settings?.["phone"] ?? CONTACT_FALLBACK.phone;
  const phone2 = settings?.["phone_2"] ?? CONTACT_FALLBACK.phone2;
  const email = settings?.["email"] ?? CONTACT_FALLBACK.email;
  const address = settings?.["address"] ?? CONTACT_FALLBACK.address;
  const address2 = settings?.["address_2"] ?? CONTACT_FALLBACK.address2;
  const map1 = settings?.["map_query_1"] ?? CONTACT_FALLBACK.map1;
  const map2 = settings?.["map_query_2"] ?? CONTACT_FALLBACK.map2;
  const whatsapp = settings?.["whatsapp_community_url"] ?? WHATSAPP_FALLBACK;

  return (
    <footer className="surface-navy mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo.url} alt="Prime Pure Real Estate logo" className="h-14 w-14 rounded-sm object-cover" />
              <span>
                <span className="block font-display text-xl">PRIME PURE</span>
                <span className="block text-[0.6rem] tracking-[0.3em] opacity-70">REAL ESTATE</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm opacity-75">
              Pure values. Prime living. Advisory-led buying, selling and renting across Bangalore,
              Delhi NCR and India&apos;s fastest growing corridors.
            </p>
            <div className="mt-6 space-y-4 text-sm opacity-80">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">Bangalore office</p>
                <a
                  href={mapLinkUrl(map2)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 flex items-start gap-2 hover:text-accent"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" /> {address2}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">Noida office</p>
                <a
                  href={mapLinkUrl(map1)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 flex items-start gap-2 hover:text-accent"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" /> {address}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-accent">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li><Link to="/properties" search={{ intent: "buy" }} className="hover:text-accent">Buy a home</Link></li>
              <li><Link to="/properties" search={{ intent: "rent" }} className="hover:text-accent">Rent a home</Link></li>
              <li><Link to="/properties" search={{ intent: "all" }} className="hover:text-accent">All listings</Link></li>
              <li><Link to="/" hash="showcase" className="hover:text-accent">Featured projects</Link></li>
              <li><Link to="/" hash="videos" className="hover:text-accent">Client walkthroughs</Link></li>
              <li><Link to="/" hash="locations" className="hover:text-accent">Our offices &amp; maps</Link></li>
              <li><Link to="/" hash="faq" className="hover:text-accent">FAQs</Link></li>
              <li><Link to="/" hash="about" className="hover:text-accent">About us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-accent">Services</h3>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li><Link to="/" hash="services" className="hover:text-accent">Home loan assistance</Link></li>
              <li><Link to="/" hash="services" className="hover:text-accent">Legal &amp; RERA due diligence</Link></li>
              <li><Link to="/" hash="services" className="hover:text-accent">Property valuation</Link></li>
              <li><Link to="/" hash="services" className="hover:text-accent">NRI investment desk</Link></li>
              <li><Link to="/" hash="services" className="hover:text-accent">Rental &amp; leasing desk</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Book a site visit</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-accent">Reach us</h3>
            <ul className="mt-4 space-y-3 text-sm opacity-80">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-accent" />
                <a href={telHref(phone)} className="tabular-nums hover:text-accent">{phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-accent" />
                <a href={telHref(phone2)} className="tabular-nums hover:text-accent">{phone2}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-accent" />
                <a href={`mailto:${email}`} className="hover:text-accent">{email}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 text-accent" />
                <a href={whatsapp} target="_blank" rel="noreferrer" className="hover:text-accent">
                  WhatsApp community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-rule mt-14" />
        <p className="mt-6 text-xs leading-relaxed opacity-60">
          Disclaimer: Prime Pure Real Estate is a RERA-registered channel partner. Images are
          indicative. Prices, availability, possession dates and approvals are subject to change by the
          respective developers.
        </p>
        <div className="mt-6 flex flex-col gap-3 text-xs opacity-70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Prime Pure Real Estate. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/contact" className="hover:text-accent">Careers</Link>
            <Link to="/contact" className="hover:text-accent">Privacy</Link>
            <Link to="/auth" className="hover:text-accent">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
