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

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Helper functions for auth verification
async function verifyIsStaff(userId: string, email: string): Promise<boolean> {
  if (email.toLowerCase() === "k96606195@gmail.com") return true;
  const { connectToDatabase } = await import("@/lib/mongodb");
  const { db } = await connectToDatabase();
  const roleDoc = await db.collection("user_roles").findOne({ user_id: userId });
  return roleDoc?.role === "super_admin" || roleDoc?.role === "admin";
}

async function verifyIsSuperAdmin(userId: string, email: string): Promise<boolean> {
  if (email.toLowerCase() === "k96606195@gmail.com") return true;
  const { connectToDatabase } = await import("@/lib/mongodb");
  const { db } = await connectToDatabase();
  const roleDoc = await db.collection("user_roles").findOne({ user_id: userId });
  return roleDoc?.role === "super_admin";
}

// PUBLIC SERVER FUNCTIONS

export const getPropertiesFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Property[]> => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const data = await db.collection("properties").find({}).sort({ sort_order: 1 }).toArray();
    return data.map((row) => {
      const { _id, ...rest } = row;
      return normaliseProperty({ ...rest, id: _id.toString() });
    });
  });

export const getPropertyBySlugFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Property | null> => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const row = await db.collection("properties").findOne({ slug });
    if (!row) return null;
    const { _id, ...rest } = row;
    return normaliseProperty({ ...rest, id: _id.toString() });
  });

export const getVideosFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<SiteVideo[]> => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const data = await db.collection("site_videos").find({}).sort({ sort_order: 1 }).toArray();
    return data.map((row) => {
      const { _id, ...rest } = row;
      return { ...rest, id: _id.toString() } as SiteVideo;
    });
  });

export const getSettingsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Record<string, string>> => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const data = await db.collection("site_settings").find({}).toArray();
    const map: Record<string, string> = {};
    for (const row of data) {
      map[row.key] = row.value ?? "";
    }
    return map;
  });

export const createLeadFn = createServerFn({ method: "POST" })
  .validator(
    (lead: {
      name: string;
      mobile: string;
      email: string;
      notes?: string | null;
      source?: string;
      joined_whatsapp?: boolean;
    }) => lead,
  )
  .handler(async ({ data: lead }) => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const doc = {
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      notes: lead.notes ?? null,
      source: lead.source ?? "unknown",
      joined_whatsapp: lead.joined_whatsapp ?? false,
      created_at: new Date().toISOString(),
    };
    const result = await db.collection("leads").insertOne(doc);
    return { success: true, id: result.insertedId.toString() };
  });

export const createInquiryFn = createServerFn({ method: "POST" })
  .validator(
    (inq: {
      property_id: string | null;
      property_title: string | null;
      name: string;
      mobile: string;
      email: string;
      message: string | null;
    }) => inq,
  )
  .handler(async ({ data: inq }) => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const doc = {
      property_id: inq.property_id,
      property_title: inq.property_title,
      name: inq.name,
      mobile: inq.mobile,
      email: inq.email,
      message: inq.message ?? null,
      handled: false,
      created_at: new Date().toISOString(),
    };
    const result = await db.collection("property_inquiries").insertOne(doc);
    return { success: true, id: result.insertedId.toString() };
  });

// PROTECTED AUTH & SYNC FUNCTIONS

export const syncProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const userId = context.userId;
    const email = context.claims.email?.toLowerCase();
    const fullName = context.claims.user_metadata?.full_name || "";

    const profilesCol = db.collection("profiles");
    await profilesCol.updateOne(
      { id: userId },
      { $set: { id: userId, email, full_name: fullName, updated_at: new Date() } },
      { upsert: true }
    );

    // Auto-promote owner to super_admin
    if (email === "k96606195@gmail.com") {
      const userRolesCol = db.collection("user_roles");
      await userRolesCol.updateOne(
        { user_id: userId, role: "super_admin" },
        { $set: { user_id: userId, role: "super_admin", created_at: new Date() } },
        { upsert: true }
      );
    }
    return { success: true };
  });

export const getUserRoleFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ role: "super_admin" | "admin" | null }> => {
    const email = context.claims.email?.toLowerCase() ?? "";
    if (email === "k96606195@gmail.com") {
      return { role: "super_admin" };
    }
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const roleDoc = await db.collection("user_roles").findOne({ user_id: context.userId });
    return { role: (roleDoc?.role as "super_admin" | "admin" | null) ?? null };
  });

// PROTECTED STAFF FUNCTIONS

export const getLeadsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Lead[]> => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const data = await db.collection("leads").find({}).sort({ created_at: -1 }).toArray();
    return data.map((row) => {
      const { _id, ...rest } = row;
      return { ...rest, id: _id.toString() } as Lead;
    });
  });

export const getInquiriesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PropertyInquiry[]> => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const data = await db.collection("property_inquiries").find({}).sort({ created_at: -1 }).toArray();
    return data.map((row) => {
      const { _id, ...rest } = row;
      return { ...rest, id: _id.toString() } as PropertyInquiry;
    });
  });

export const updateInquiryHandledFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const { ObjectId } = await import("mongodb");
    
    let objectId: any;
    try {
      objectId = new ObjectId(id);
    } catch {
      await db.collection("property_inquiries").updateOne(
        { id: id },
        { $set: { handled: true } }
      );
      return { success: true };
    }

    await db.collection("property_inquiries").updateOne(
      { $or: [{ _id: objectId }, { id: id }] },
      { $set: { handled: true } }
    );
    return { success: true };
  });

export const deletePropertyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const { ObjectId } = await import("mongodb");

    let objectId: any;
    try {
      objectId = new ObjectId(id);
    } catch {
      await db.collection("properties").deleteOne({ id: id });
      return { success: true };
    }

    await db.collection("properties").deleteOne({ $or: [{ _id: objectId }, { id: id }] });
    return { success: true };
  });

export const updatePropertyPublishStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((payload: { id: string; published: boolean }) => payload)
  .handler(async ({ data: { id, published }, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const { ObjectId } = await import("mongodb");

    let objectId: any;
    try {
      objectId = new ObjectId(id);
    } catch {
      await db.collection("properties").updateOne(
        { id: id },
        { $set: { published } }
      );
      return { success: true };
    }

    await db.collection("properties").updateOne(
      { $or: [{ _id: objectId }, { id: id }] },
      { $set: { published } }
    );
    return { success: true };
  });

export const updateVideoPublishStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((payload: { id: string; published: boolean }) => payload)
  .handler(async ({ data: { id, published }, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    const { ObjectId } = await import("mongodb");

    let objectId: any;
    try {
      objectId = new ObjectId(id);
    } catch {
      await db.collection("site_videos").updateOne(
        { id: id },
        { $set: { published } }
      );
      return { success: true };
    }

    await db.collection("site_videos").updateOne(
      { $or: [{ _id: objectId }, { id: id }] },
      { $set: { published } }
    );
    return { success: true };
  });

export const saveSettingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((payload: { key: string; value: string }) => payload)
  .handler(async ({ data: { key, value }, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();
    await db.collection("site_settings").updateOne(
      { key },
      { $set: { key, value, updated_at: new Date() } },
      { upsert: true }
    );
    return { success: true };
  });

export const createPropertyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((property: any) => property)
  .handler(async ({ data: property, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isStaff = await verifyIsStaff(context.userId, email);
    if (!isStaff) throw new Error("Unauthorized: Staff only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();

    const slug = property.slug || property.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const doc = {
      ...property,
      slug,
      gallery: property.gallery ?? [],
      amenities: property.amenities ?? [],
      highlights: property.highlights ?? [],
      created_at: new Date()
    };

    const result = await db.collection("properties").insertOne(doc);
    return { success: true, id: result.insertedId.toString() };
  });

export const addAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((emailToPromote: string) => emailToPromote)
  .handler(async ({ data: emailToPromote, context }) => {
    const email = context.claims.email?.toLowerCase() ?? "";
    const isSuperAdmin = await verifyIsSuperAdmin(context.userId, email);
    if (!isSuperAdmin) throw new Error("Unauthorized: Super Admin only");

    const { connectToDatabase } = await import("@/lib/mongodb");
    const { db } = await connectToDatabase();

    const cleanEmail = emailToPromote.trim().toLowerCase();
    
    // Find user profile in MongoDB profiles collection
    const profile = await db.collection("profiles").findOne({ email: cleanEmail });
    if (!profile) {
      throw new Error("No account found with that email in MongoDB database. Ask them to sign up first.");
    }

    await db.collection("user_roles").updateOne(
      { user_id: profile.id, role: "admin" },
      { $set: { user_id: profile.id, role: "admin", created_at: new Date() } },
      { upsert: true }
    );
    return { success: true };
  });

// REACT QUERY WRAPPERS FOR CLIENT

export const propertiesQuery = {
  queryKey: ["properties"],
  queryFn: () => getPropertiesFn(),
};

export function propertyBySlugQuery(slug: string) {
  return {
    queryKey: ["property", slug],
    queryFn: () => getPropertyBySlugFn({ data: slug }),
  };
}

export const videosQuery = {
  queryKey: ["site_videos"],
  queryFn: () => getVideosFn(),
};

export const settingsQuery = {
  queryKey: ["site_settings"],
  queryFn: () => getSettingsFn(),
};

export const leadsQuery = {
  queryKey: ["leads"],
  queryFn: () => getLeadsFn(),
};

export const inquiriesQuery = {
  queryKey: ["property_inquiries"],
  queryFn: () => getInquiriesFn(),
};
