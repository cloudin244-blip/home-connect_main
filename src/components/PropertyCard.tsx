import { Link } from "@tanstack/react-router";
import { ArrowRight, Bath, BedDouble, MapPin, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/site-data";
import { formatINR } from "@/lib/site-data";

export function PropertyCard({ property }: { property: Property }) {
  const price = property.price_value ? formatINR(property.price_value) : property.price;
  const isRent = property.status.toLowerCase().includes("rent");

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-elegant">
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {property.image_url && (
          <img
            src={property.image_url}
            alt={property.title}
            loading="lazy"
            width={1280}
            height={854}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <Badge className="absolute left-4 top-4">{property.status}</Badge>
        <Badge variant="secondary" className="absolute right-4 top-4">
          {property.property_type}
        </Badge>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 text-accent" /> {property.location}
        </p>
        <p className="mt-4 font-display text-2xl tabular-nums text-accent">
          {price}
          {isRent && <span className="ml-1 text-sm text-muted-foreground">/ month</span>}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs tabular-nums text-muted-foreground">
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
        {property.slug && (
          <Link
            to="/property/$slug"
            params={{ slug: property.slug }}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
          >
            View details <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}
