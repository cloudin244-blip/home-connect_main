import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/home-connect";
const MONGODB_DB = process.env.MONGODB_DB || "home-connect";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  // Auto seed database if empty
  await seedDatabaseIfEmpty(db);

  return { client, db };
}

async function seedDatabaseIfEmpty(db: Db) {
  // 1. Seed Site Settings
  const settingsCol = db.collection("site_settings");
  const settingsCount = await settingsCol.countDocuments();
  if (settingsCount === 0) {
    console.log("[MongoDB] Seeding site_settings collection...");
    await settingsCol.insertMany([
      { key: "whatsapp_community_url", value: "https://chat.whatsapp.com/EImq5qltaWqHQQrxNfn7Ym", updated_at: new Date() },
      { key: "hero_title", value: "Pure Values. Prime Living.", updated_at: new Date() },
      { key: "hero_subtitle", value: "Handpicked residences, transparent pricing and advisors who stay with you from first visit to final key.", updated_at: new Date() },
      { key: "phone", value: "+91 93549 92890", updated_at: new Date() },
      { key: "email", value: "sales@primepurerealestate.in", updated_at: new Date() },
      { key: "address", value: "Prime Pure Real Estate, Sector 62, Noida, India", updated_at: new Date() }
    ]);
  }

  // 2. Seed Properties
  const propertiesCol = db.collection("properties");
  const propertiesCount = await propertiesCol.countDocuments();
  if (propertiesCount === 0) {
    console.log("[MongoDB] Seeding properties collection...");
    await propertiesCol.insertMany([
      {
        title: "Prime Skyline Residences",
        location: "Sector 62, Noida",
        city: "Noida",
        price: "₹1.85 Cr",
        price_value: 18500000,
        bedrooms: 3,
        bathrooms: 3,
        area: "1,845 sq.ft",
        property_type: "Apartment",
        status: "For Sale",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Ready to Move",
        rera_id: "UPRERAPRJ12345",
        map_query: "Sector 62, Noida",
        description: "Corner three-bedroom home with double-height living room and skyline views.",
        featured: true,
        published: true,
        sort_order: 1,
        slug: "prime-skyline-residences",
        created_at: new Date()
      },
      {
        title: "Pure Garden Villas",
        location: "Golf Course Road, Gurugram",
        city: "Gurugram",
        price: "₹4.20 Cr",
        price_value: 42000000,
        bedrooms: 4,
        bathrooms: 5,
        area: "3,600 sq.ft",
        property_type: "Villa",
        status: "For Sale",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Dec 2026",
        rera_id: "HRERA2023_098",
        map_query: "Golf Course Road, Gurugram",
        description: "Independent villa with private lawn, home theatre and staff quarters.",
        featured: true,
        published: true,
        sort_order: 2,
        slug: "pure-garden-villas",
        created_at: new Date()
      },
      {
        title: "Prime Central Offices",
        location: "Cyber City, Gurugram",
        city: "Gurugram",
        price: "₹1.10 Lakh / mo",
        price_value: 110000,
        bedrooms: 0,
        bathrooms: 2,
        area: "2,200 sq.ft",
        property_type: "Commercial",
        status: "For Rent",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Immediate",
        rera_id: null,
        map_query: "Cyber City, Gurugram",
        description: "Fitted grade-A office floor with 40 workstations and two cabins.",
        featured: false,
        published: true,
        sort_order: 3,
        slug: "prime-central-offices",
        created_at: new Date()
      },
      {
        title: "Pure Riverfront Apartments",
        location: "Ahmedabad Riverfront",
        city: "Ahmedabad",
        price: "₹95 Lakh",
        price_value: 9500000,
        bedrooms: 2,
        bathrooms: 2,
        area: "1,180 sq.ft",
        property_type: "Apartment",
        status: "For Sale",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Ready to Move",
        rera_id: "GUJRERA00987",
        map_query: "Ahmedabad Riverfront Promenade",
        description: "Sunlit two-bedroom apartment overlooking the promenade.",
        featured: false,
        published: true,
        sort_order: 4,
        slug: "pure-riverfront-apartments",
        created_at: new Date()
      },
      {
        title: "Prime Heights Penthouse",
        location: "Worli, Mumbai",
        city: "Mumbai",
        price: "₹9.50 Cr",
        price_value: 95000000,
        bedrooms: 4,
        bathrooms: 4,
        area: "4,100 sq.ft",
        property_type: "Penthouse",
        status: "For Sale",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Ready to Move",
        rera_id: "MHARERA50009",
        map_query: "Worli, Mumbai",
        description: "Duplex penthouse with private terrace pool and sea views.",
        featured: true,
        published: true,
        sort_order: 5,
        slug: "prime-heights-penthouse",
        created_at: new Date()
      },
      {
        title: "Pure Green Plots",
        location: "Devanahalli, Bengaluru",
        city: "Bengaluru",
        price: "₹48 Lakh",
        price_value: 4800000,
        bedrooms: 0,
        bathrooms: 0,
        area: "2,400 sq.ft",
        property_type: "Plot",
        status: "For Sale",
        image_url: null,
        gallery: [],
        amenities: [],
        highlights: [],
        possession: "Ready for Registration",
        rera_id: "KRRERA09923",
        map_query: "Devanahalli, Bengaluru",
        description: "Gated community plot minutes from the airport expressway.",
        featured: false,
        published: true,
        sort_order: 6,
        slug: "pure-green-plots",
        created_at: new Date()
      }
    ]);
  }

  // 3. Seed Site Videos
  const videosCol = db.collection("site_videos");
  
  // Clean up any existing cartoon video references in the database
  await videosCol.updateOne(
    { section: "hero", video_url: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { $set: { video_url: "/videos/hero-building.mp4" } }
  );

  const videosCount = await videosCol.countDocuments();
  if (videosCount === 0) {
    console.log("[MongoDB] Seeding site_videos collection...");
    await videosCol.insertMany([
      {
        title: "Hero Showcase Video",
        description: "Cinematic drone view of our key real-estate projects.",
        video_url: "/videos/hero-building.mp4",
        section: "hero",
        sort_order: 1,
        published: true,
        created_at: new Date()
      }
    ]);
  }
}
