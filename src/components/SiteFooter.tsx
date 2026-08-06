import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";

import logo from "@/assets/prime-pure-logo.asset.json";
import { settingsQuery, WHATSAPP_FALLBACK } from "@/lib/site-data";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);
  const phone = settings?.["phone"] ?? "+91 96606 19500";
  const email = settings?.["email"] ?? "k96606195@gmail.com";
  const address = settings?.["address"] ?? "Prime Pure Real Estate, Noida, India";
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
              Pure values. Prime living. Advisory-led buying, selling and renting across India's
              fastest growing corridors.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-accent">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li><Link to="/properties" search={{ intent: "buy" }} className="hover:text-accent">Buy a home</Link></li>
              <li><Link to="/properties" search={{ intent: "rent" }} className="hover:text-accent">Rent a home</Link></li>
              <li><Link to="/" hash="showcase" className="hover:text-accent">Featured projects</Link></li>
              <li><Link to="/" hash="videos" className="hover:text-accent">Client walkthroughs</Link></li>
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
              <li><Link to="/contact" className="hover:text-accent">Book a site visit</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-accent">Reach us</h3>
            <ul className="mt-4 space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" /> {address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-accent" />
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-accent">{phone}</a>
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
        <div className="mt-6 flex flex-col gap-3 text-xs opacity-70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Prime Pure Real Estate. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/contact" className="hover:text-accent">Careers</Link>
            <Link to="/contact" className="hover:text-accent">Privacy</Link>
            <Link to="/auth" className="hover:text-accent">Team login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
