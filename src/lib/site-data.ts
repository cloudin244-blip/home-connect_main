import { supabase } from "@/integrations/supabase/client";

export type Property = {
  id: string;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: string | null;
  property_type: string;
  status: string;
  image_url: string | null;
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

export const WHATSAPP_FALLBACK = "https://chat.whatsapp.com/EImq5qltaWqHQQrxNfn7Ym";

export const propertiesQuery = {
  queryKey: ["properties"],
  queryFn: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Property[];
  },
};

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
