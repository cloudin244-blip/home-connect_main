import { ExternalLink, MapPin } from "lucide-react";

import { mapEmbedUrl, mapLinkUrl } from "@/lib/site-data";

type Props = {
  title: string;
  address: string;
  query: string;
  className?: string;
};

export function LocationMap({ title, address, query, className }: Props) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-card ${className ?? ""}`}>
      <iframe
        title={`Map of ${title}`}
        src={mapEmbedUrl(query)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-64 w-full border-0"
      />
      <div className="p-5">
        <h3 className="font-display text-lg">{title}</h3>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          {address}
        </p>
        <a
          href={mapLinkUrl(query)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent"
        >
          Get directions <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
