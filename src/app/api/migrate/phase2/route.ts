import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Only admin users can run migrations
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'DB password required' }, { status: 400 })
    }

    // Use postgres package for direct DB access (DDL operations)
    const postgres = (await import('postgres')).default
    const sql = postgres({
      host: `db.${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').replace('.supabase.co', '')}.supabase.co`,
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: password,
      ssl: 'require',
      connect_timeout: 10,
    })

    const results: string[] = []

    try {
      // Test connection
      await sql`SELECT 1`
      results.push('✓ Connected to database')

      // 1. Create installateurs table
      await sql`
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
        )
      `
      results.push('✓ Created installateurs table')

      // 2. Create clients_finaux table
      await sql`
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
        )
      `
      results.push('✓ Created clients_finaux table')

      // 3. Create batiments table
      await sql`
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
        )
      `
      results.push('✓ Created batiments table')

      // 4. Create techniciens table
      await sql`
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
        )
      `
      results.push('✓ Created techniciens table')

      // 5. Create interventions table
      await sql`
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
        )
      `
      results.push('✓ Created interventions table')

      // 6. Create dn_diametres reference table
      await sql`
        CREATE TABLE IF NOT EXISTS dn_diametres (
          id SERIAL PRIMARY KEY,
          dn TEXT NOT NULL,
          diametre_int_mm DECIMAL(6,2),
          ordre INTEGER
        )
      `
      // Insert DN values
      await sql`
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
        ON CONFLICT DO NOTHING
      `
      results.push('✓ Created dn_diametres table with data')

      // 7. Create localisations_type reference table
      await sql`
        CREATE TABLE IF NOT EXISTS localisations_type (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          libelle TEXT NOT NULL,
          ordre INTEGER
        )
      `
      await sql`
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
        ON CONFLICT (code) DO NOTHING
      `
      results.push('✓ Created localisations_type table with data')

      // 8. Add intervention_id to rapports tables
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL`
      await sql`ALTER TABLE rapports_desembouage ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL`
      results.push('✓ Added intervention_id to rapport tables')

      // 9. Add multi-tenant columns to user_profiles
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS installateur_id UUID REFERENCES installateurs(id) ON DELETE SET NULL`
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS technicien_id UUID REFERENCES techniciens(id) ON DELETE SET NULL`
      results.push('✓ Added multi-tenant columns to user_profiles')

      // 10. Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_clients_installateur ON clients_finaux(installateur_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_batiments_client ON batiments(client_final_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_techniciens_installateur ON techniciens(installateur_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_techniciens_user ON techniciens(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_interventions_batiment ON interventions(batiment_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_interventions_technicien ON interventions(technicien_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_interventions_numero ON interventions(numero_dossier)`
      await sql`CREATE INDEX IF NOT EXISTS idx_interventions_statut ON interventions(statut)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rapports_eq_intervention ON rapports_equilibrage(intervention_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rapports_de_intervention ON rapports_desembouage(intervention_id)`
      results.push('✓ Created indexes')

      // 11. Enable RLS
      await sql`ALTER TABLE installateurs ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE clients_finaux ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE batiments ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE techniciens ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE interventions ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE dn_diametres ENABLE ROW LEVEL SECURITY`
      await sql`ALTER TABLE localisations_type ENABLE ROW LEVEL SECURITY`
      results.push('✓ Enabled RLS on new tables')

      // 12. Create RLS policies (temporary - full access for authenticated users)
      const policies = [
        { table: 'installateurs', name: 'installateurs_authenticated' },
        { table: 'clients_finaux', name: 'clients_authenticated' },
        { table: 'batiments', name: 'batiments_authenticated' },
        { table: 'techniciens', name: 'techniciens_authenticated' },
        { table: 'interventions', name: 'interventions_authenticated' },
      ]

      for (const p of policies) {
        try {
          await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON ${sql(p.table)}`
        } catch { /* ignore */ }
        await sql.unsafe(`CREATE POLICY "${p.name}" ON ${p.table} FOR ALL TO authenticated USING (true) WITH CHECK (true)`)
      }

      // Reference tables - read only
      try { await sql`DROP POLICY IF EXISTS dn_diametres_read ON dn_diametres` } catch { /* ignore */ }
      await sql`CREATE POLICY "dn_diametres_read" ON dn_diametres FOR SELECT TO authenticated USING (true)`
      try { await sql`DROP POLICY IF EXISTS localisations_read ON localisations_type` } catch { /* ignore */ }
      await sql`CREATE POLICY "localisations_read" ON localisations_type FOR SELECT TO authenticated USING (true)`
      results.push('✓ Created RLS policies')

      // 13. Create updated_at trigger function
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `

      // Create triggers
      const tables = ['installateurs', 'clients_finaux', 'batiments', 'techniciens', 'interventions']
      for (const t of tables) {
        await sql.unsafe(`DROP TRIGGER IF EXISTS update_${t}_updated_at ON ${t}`)
        await sql.unsafe(`CREATE TRIGGER update_${t}_updated_at BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`)
      }
      results.push('✓ Created updated_at triggers')

      await sql.end()
    } catch (dbErr) {
      await sql.end().catch(() => {})
      throw dbErr
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
