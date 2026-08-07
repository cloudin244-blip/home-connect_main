ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS price_value bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS possession text,
  ADD COLUMN IF NOT EXISTS rera_id text,
  ADD COLUMN IF NOT EXISTS map_query text,
  ADD COLUMN IF NOT EXISTS city text;

UPDATE public.properties SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_key ON public.properties (slug);

CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_title text,
  name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  message text,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.property_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_inquiries TO authenticated;
GRANT ALL ON public.property_inquiries TO service_role;

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_inquiries_public_insert" ON public.property_inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "property_inquiries_staff_select" ON public.property_inquiries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "property_inquiries_staff_update" ON public.property_inquiries
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "property_inquiries_staff_delete" ON public.property_inquiries
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));