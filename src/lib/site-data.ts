import { supabase } from "@/integrations/supabase/client";

export type Property = {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  city: string | null;
  price: string;
  price_value: number;
  bedrooms: number;
  bathrooms: number;
  area: string | null;
  property_type: string;
  status: string;
  image_url: string | null;
  gallery: string[];
  amenities: string[];
  highlights: string[];
  possession: string | null;
  rera_id: string | null;
  map_query: string | null;
  description: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

export type SiteVideo = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  section: string;
  sort_order: number;
  published: boolean;
};

export type Lead = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  notes: string | null;
  joined_whatsapp: boolean;
  created_at: string;
};

export type PropertyInquiry = {
  id: string;
  property_id: string | null;
  property_title: string | null;
  name: string;
  mobile: string;
  email: string;
  message: string | null;
  handled: boolean;
  created_at: string;
};

export const WHATSAPP_FALLBACK = "https://chat.whatsapp.com/EImq5qltaWqHQQrxNfn7Ym";

export const CONTACT_FALLBACK = {
  phone: "+91 93549 92890",
  phone2: "+91 82089 66426",
  email: "sales@primepurerealestate.in",
  address: "Prime Pure Real Estate, Sector 62, Noida, Uttar Pradesh 201309",
  address2: "Prime Pure Real Estate, Electronic City Phase-2, Bangalore, Karnataka 560100",
  map1: "Sector 62, Noida, Uttar Pradesh 201309",
  map2: "Electronic City Phase 2, Bangalore, Karnataka 560100",
};

/** Renders a rupee amount in the Indian short scale, e.g. ₹1.35 Cr / ₹78 Lakh. */
export function formatINR(value: number): string {
  if (!value) return "Price on request";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    const lakh = value / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function mapLinkUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normaliseProperty(row: Record<string, unknown>): Property {
  const gallery = Array.isArray(row["gallery"]) ? (row["gallery"] as string[]) : [];
  return {
    ...(row as unknown as Property),
    gallery,
    amenities: (row["amenities"] as string[] | null) ?? [],
    highlights: (row["highlights"] as string[] | null) ?? [],
  };
}

export const propertiesQuery = {
  queryKey: ["properties"],
  queryFn: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => normaliseProperty(row as Record<string, unknown>));
  },
};

export function propertyBySlugQuery(slug: string) {
  return {
    queryKey: ["property", slug],
    queryFn: async (): Promise<Property | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normaliseProperty(data as Record<string, unknown>) : null;
    },
  };
}

export const videosQuery = {
  queryKey: ["site_videos"],
  queryFn: async (): Promise<SiteVideo[]> => {
    const { data, error } = await supabase
      .from("site_videos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as SiteVideo[];
  },
};

export const settingsQuery = {
  queryKey: ["site_settings"],
  queryFn: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from("site_settings").select("key,value");
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key as string] = (row.value as string) ?? "";
    return map;
  },
};

export const leadsQuery = {
  queryKey: ["leads"],
  queryFn: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  },
};

export const inquiriesQuery = {
  queryKey: ["property_inquiries"],
  queryFn: async (): Promise<PropertyInquiry[]> => {
    const { data, error } = await supabase
      .from("property_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PropertyInquiry[];
  },
};
