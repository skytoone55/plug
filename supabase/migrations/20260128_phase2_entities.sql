-- ============================================
-- PLUG2DRIVE Phase 2 - Entités & Base de Données
-- Migration: 2026-01-28
-- ============================================

-- 1. Installateurs (sociétés partenaires)
CREATE TABLE IF NOT EXISTS installateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  siret TEXT,
  siren TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  logo_url TEXT,
  certification TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clients Finaux (syndics, bailleurs, copros)
CREATE TABLE IF NOT EXISTS clients_finaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installateur_id UUID REFERENCES installateurs(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('syndic', 'bailleur', 'copropriete', 'particulier')),
  nom TEXT NOT NULL,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  contact_nom TEXT,
  contact_tel TEXT,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bâtiments
CREATE TABLE IF NOT EXISTS batiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_final_id UUID REFERENCES clients_finaux(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  adresse_ligne2 TEXT,
  code_postal TEXT,
  ville TEXT,
  reference_cadastrale TEXT,
  zone_climatique TEXT CHECK (zone_climatique IN ('H1', 'H2', 'H3')),
  nb_appartements INTEGER,
  nb_batiments INTEGER DEFAULT 1,
  nb_etages INTEGER,
  annee_construction INTEGER,
  type_chauffage TEXT,
  nature_reseau TEXT CHECK (nature_reseau IN ('Acier', 'Cuivre', 'Multicouche', 'Synthetique')),
  puissance_nominale_kw INTEGER,
  gardien_nom TEXT,
  gardien_tel TEXT,
  acces_info TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Techniciens
CREATE TABLE IF NOT EXISTS techniciens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  installateur_id UUID REFERENCES installateurs(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  signature_url TEXT,
  certifications TEXT[],
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Interventions (conteneur pour rapports)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batiment_id UUID REFERENCES batiments(id) ON DELETE SET NULL,
  technicien_id UUID REFERENCES techniciens(id) ON DELETE SET NULL,
  numero_dossier TEXT UNIQUE,
  type TEXT CHECK (type IN ('equilibrage', 'desembouage', 'maintenance')),
  date_intervention DATE,
  date_fin_intervention DATE,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'edite', 'envoye', 'facture', 'paye')),
  reference_devis TEXT,
  dossier_pixel TEXT,
  montant_ht DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tables de référence - Diamètres nominaux (DN)
CREATE TABLE IF NOT EXISTS dn_diametres (
  id SERIAL PRIMARY KEY,
  dn TEXT NOT NULL,
  diametre_int_mm DECIMAL(6,2),
  ordre INTEGER
);

-- Insérer les valeurs DN standard
INSERT INTO dn_diametres (dn, diametre_int_mm, ordre) VALUES
  ('DN10', 10.0, 1),
  ('DN15', 16.0, 2),
  ('DN20', 21.0, 3),
  ('DN25', 27.0, 4),
  ('DN32', 35.0, 5),
  ('DN40', 41.0, 6),
  ('DN50', 53.0, 7),
  ('DN65', 68.0, 8),
  ('DN80', 80.0, 9),
  ('DN100', 105.0, 10),
  ('DN125', 130.0, 11),
  ('DN150', 155.0, 12)
ON CONFLICT DO NOTHING;

-- 7. Tables de référence - Types de localisation
CREATE TABLE IF NOT EXISTS localisations_type (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  ordre INTEGER
);

-- Insérer les types de localisation standard
INSERT INTO localisations_type (code, libelle, ordre) VALUES
  ('CHAUFFERIE', 'Chaufferie', 1),
  ('SOUS_STATION', 'Sous-station', 2),
  ('LOCAL_TECHNIQUE', 'Local technique', 3),
  ('COLONNE_MONTANTE', 'Colonne montante', 4),
  ('PALIER', 'Palier', 5),
  ('APPARTEMENT', 'Appartement', 6),
  ('CAVE', 'Cave', 7),
  ('PARKING', 'Parking', 8),
  ('EXTERIEUR', 'Extérieur', 9)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Ajout colonnes aux tables rapports existantes
-- ============================================

-- Lier rapports_equilibrage aux interventions
ALTER TABLE rapports_equilibrage
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL;

-- Lier rapports_desembouage aux interventions
ALTER TABLE rapports_desembouage
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL;

-- ============================================
-- Extension user_profiles pour multi-tenant
-- ============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS installateur_id UUID REFERENCES installateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS technicien_id UUID REFERENCES techniciens(id) ON DELETE SET NULL;

-- ============================================
-- Index pour performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_installateur ON clients_finaux(installateur_id);
CREATE INDEX IF NOT EXISTS idx_batiments_client ON batiments(client_final_id);
CREATE INDEX IF NOT EXISTS idx_techniciens_installateur ON techniciens(installateur_id);
CREATE INDEX IF NOT EXISTS idx_techniciens_user ON techniciens(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_batiment ON interventions(batiment_id);
CREATE INDEX IF NOT EXISTS idx_interventions_technicien ON interventions(technicien_id);
CREATE INDEX IF NOT EXISTS idx_interventions_numero ON interventions(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_interventions_statut ON interventions(statut);
CREATE INDEX IF NOT EXISTS idx_rapports_eq_intervention ON rapports_equilibrage(intervention_id);
CREATE INDEX IF NOT EXISTS idx_rapports_de_intervention ON rapports_desembouage(intervention_id);

-- ============================================
-- RLS Policies (Phase 4 - préparation)
-- ============================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE installateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_finaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE batiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE techniciens ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Policies temporaires - accès complet pour authenticated users
-- (sera affiné en Phase 4 pour multi-tenant)

CREATE POLICY "installateurs_authenticated" ON installateurs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "clients_authenticated" ON clients_finaux
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "batiments_authenticated" ON batiments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "techniciens_authenticated" ON techniciens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "interventions_authenticated" ON interventions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tables de référence - lecture publique
CREATE POLICY "dn_diametres_read" ON dn_diametres
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "localisations_read" ON localisations_type
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- Triggers pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_installateurs_updated_at
  BEFORE UPDATE ON installateurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_finaux_updated_at
  BEFORE UPDATE ON clients_finaux
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batiments_updated_at
  BEFORE UPDATE ON batiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_techniciens_updated_at
  BEFORE UPDATE ON techniciens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON interventions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
