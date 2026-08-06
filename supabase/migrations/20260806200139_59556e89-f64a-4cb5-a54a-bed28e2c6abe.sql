-- ROLES
CREATE TYPE public.app_role AS ENUM ('super_admin','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'));
$$;

CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "user_roles_super_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "user_roles_super_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') AND role <> 'super_admin');

-- new user handler: profile + auto super admin for the owner email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'k96606195@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'voice_bot',
  notes text,
  joined_whatsapp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads_staff_select" ON public.leads FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "leads_staff_update" ON public.leads FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "leads_staff_delete" ON public.leads FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- PROPERTIES
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL,
  price text NOT NULL,
  bedrooms int NOT NULL DEFAULT 0,
  bathrooms int NOT NULL DEFAULT 0,
  area text,
  property_type text NOT NULL DEFAULT 'Apartment',
  status text NOT NULL DEFAULT 'For Sale',
  image_url text,
  description text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_public_read" ON public.properties FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "properties_staff_write" ON public.properties FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- VIDEOS
CREATE TABLE public.site_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  section text NOT NULL DEFAULT 'agent',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_videos TO authenticated;
GRANT ALL ON public.site_videos TO service_role;
ALTER TABLE public.site_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_videos_public_read" ON public.site_videos FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "site_videos_staff_write" ON public.site_videos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SETTINGS
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_settings_staff_write" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_community_url','https://chat.whatsapp.com/EImq5qltaWqHQQrxNfn7Ym'),
  ('hero_title','Pure Values. Prime Living.'),
  ('hero_subtitle','Handpicked residences, transparent pricing and advisors who stay with you from first visit to final key.'),
  ('phone','+91 96606 19500'),
  ('email','k96606195@gmail.com'),
  ('address','Prime Pure Real Estate, Sector 62, Noida, India');

INSERT INTO public.properties (title, location, price, bedrooms, bathrooms, area, property_type, status, image_url, description, featured, sort_order) VALUES
  ('Prime Skyline Residences','Sector 62, Noida','₹1.85 Cr',3,3,'1,845 sq.ft','Apartment','For Sale',null,'Corner three-bedroom home with double-height living room and skyline views.',true,1),
  ('Pure Garden Villas','Golf Course Road, Gurugram','₹4.20 Cr',4,5,'3,600 sq.ft','Villa','For Sale',null,'Independent villa with private lawn, home theatre and staff quarters.',true,2),
  ('Prime Central Offices','Cyber City, Gurugram','₹1.10 Lakh / mo',0,2,'2,200 sq.ft','Commercial','For Rent',null,'Fitted grade-A office floor with 40 workstations and two cabins.',false,3),
  ('Pure Riverfront Apartments','Ahmedabad Riverfront','₹95 Lakh',2,2,'1,180 sq.ft','Apartment','For Sale',null,'Sunlit two-bedroom apartment overlooking the promenade.',false,4),
  ('Prime Heights Penthouse','Worli, Mumbai','₹9.50 Cr',4,4,'4,100 sq.ft','Penthouse','For Sale',null,'Duplex penthouse with private terrace pool and sea views.',true,5),
  ('Pure Green Plots','Devanahalli, Bengaluru','₹48 Lakh',0,0,'2,400 sq.ft','Plot','For Sale',null,'Gated community plot minutes from the airport expressway.',false,6);