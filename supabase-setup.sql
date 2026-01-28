-- ============================================
-- PLUG2DRIVE — Supabase Database Setup
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'technicien')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des rapports d'équilibrage
CREATE TABLE IF NOT EXISTS public.rapports_equilibrage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Bénéficiaire
  beneficiaire_nom TEXT,
  beneficiaire_adresse TEXT,
  beneficiaire_code_postal TEXT,
  beneficiaire_ville TEXT,
  beneficiaire_telephone TEXT,
  beneficiaire_email TEXT,

  -- Prestataire
  prestataire_nom TEXT,
  prestataire_adresse TEXT,
  prestataire_code_postal TEXT,
  prestataire_ville TEXT,
  prestataire_telephone TEXT,
  prestataire_email TEXT,
  prestataire_logo_url TEXT,

  -- Site
  site_adresse TEXT,
  site_code_postal TEXT,
  site_ville TEXT,
  site_ref_cadastrale TEXT,
  site_nb_batiments INTEGER,
  site_nb_niveaux INTEGER,
  site_nb_lots INTEGER,

  -- Technicien
  technicien_nom TEXT,
  technicien_prenom TEXT,
  technicien_date_intervention TEXT,

  -- Description
  description_reseau TEXT,
  methode_equilibrage TEXT,

  -- Installation (conditionnel)
  commentaire_chaufferie TEXT,
  photos_chaufferie JSONB DEFAULT '[]',

  -- Tableaux dynamiques
  tab_mesure_debit JSONB DEFAULT '[]',
  tab_mesure_temperature JSONB DEFAULT '[]',

  -- Photos
  photos_equipement JSONB DEFAULT '[]',
  photos_intervention JSONB DEFAULT '[]',

  -- Signatures
  signature_technicien TEXT,
  signature_client TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des rapports de désembouage
CREATE TABLE IF NOT EXISTS public.rapports_desembouage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Bénéficiaire
  beneficiaire_nom TEXT,
  beneficiaire_adresse TEXT,
  beneficiaire_code_postal TEXT,
  beneficiaire_ville TEXT,
  beneficiaire_telephone TEXT,
  beneficiaire_email TEXT,

  -- Prestataire
  prestataire_nom TEXT,
  prestataire_adresse TEXT,
  prestataire_code_postal TEXT,
  prestataire_ville TEXT,
  prestataire_telephone TEXT,
  prestataire_email TEXT,
  prestataire_logo_url TEXT,

  -- Site
  site_adresse TEXT,
  site_code_postal TEXT,
  site_ville TEXT,
  site_nb_batiments INTEGER,
  site_nb_appartements INTEGER,

  -- Technicien
  technicien_nom TEXT,
  technicien_prenom TEXT,
  technicien_date_intervention TEXT,

  -- Données techniques
  type_installation TEXT,
  type_reseau TEXT,
  nb_emetteurs INTEGER,
  volume_eau_estimatif NUMERIC,
  volume_total_eau NUMERIC,

  -- Produits
  reac_desembouant_nom TEXT,
  reac_desembouant_qte NUMERIC,
  reac_desembouant_duree TEXT,
  produit_inhibiteur_nom TEXT,
  produit_inhibiteur_qte NUMERIC,

  -- Résultats
  ph_avant NUMERIC,
  ph_apres NUMERIC,
  temperature_avant NUMERIC,
  temperature_apres NUMERIC,

  -- Photos
  photos_produits JSONB DEFAULT '[]',
  photos_vue_aerienne JSONB DEFAULT '[]',
  photos_batiments JSONB DEFAULT '[]',
  photos_boues JSONB DEFAULT '[]',
  photos_justificatifs JSONB DEFAULT '[]',

  -- Signatures
  signature_technicien TEXT,
  signature_client TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_equilibrage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_desembouage ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- User Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User Profiles: Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User Profiles: Service role can do anything (for initial setup)
CREATE POLICY "Service role full access profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Rapports Équilibrage: Users can CRUD their own reports
CREATE POLICY "Users can view own equilibrage reports" ON public.rapports_equilibrage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert equilibrage reports" ON public.rapports_equilibrage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equilibrage reports" ON public.rapports_equilibrage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equilibrage reports" ON public.rapports_equilibrage
  FOR DELETE USING (auth.uid() = user_id);

-- Rapports Équilibrage: Admins can view all
CREATE POLICY "Admins can view all equilibrage reports" ON public.rapports_equilibrage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all equilibrage reports" ON public.rapports_equilibrage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Rapports Désembouage: Users can CRUD their own reports
CREATE POLICY "Users can view own desembouage reports" ON public.rapports_desembouage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert desembouage reports" ON public.rapports_desembouage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own desembouage reports" ON public.rapports_desembouage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own desembouage reports" ON public.rapports_desembouage
  FOR DELETE USING (auth.uid() = user_id);

-- Rapports Désembouage: Admins can view all
CREATE POLICY "Admins can view all desembouage reports" ON public.rapports_desembouage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all desembouage reports" ON public.rapports_desembouage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Create these manually in Supabase Dashboard > Storage
-- Bucket: photos (public)
-- Bucket: logos (public)
-- Bucket: signatures (public)
-- Bucket: schemas (public)

-- Storage policies (after creating buckets)
-- Allow authenticated users to upload
-- Allow public read access
