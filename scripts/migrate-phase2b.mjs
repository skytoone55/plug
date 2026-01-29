import postgres from 'postgres'

const sql = postgres({
  host: 'db.bnfudxssdnphfbqcoext.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: process.argv[2] || '@Supabase1532',
  ssl: 'require',
  connect_timeout: 15,
})

async function migrate() {
  const results = []

  try {
    await sql`SELECT 1`
    results.push('✓ Connected to database')

    // 1. Mettre à jour les rôles dans user_profiles
    await sql`
      ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_role_check
    `
    await sql`
      ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_role_check
      CHECK (role IN ('admin', 'installateur', 'technicien'))
    `
    results.push('✓ Updated user_profiles roles (admin, installateur, technicien)')

    // 2. Créer table chantiers (remplace/complète batiments)
    await sql`
      CREATE TABLE IF NOT EXISTS chantiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients_finaux(id) ON DELETE CASCADE,
        nom TEXT NOT NULL,
        adresse TEXT,
        adresse_complement TEXT,
        code_postal TEXT,
        ville TEXT,
        reference_cadastrale TEXT,
        zone_climatique TEXT CHECK (zone_climatique IN ('H1', 'H2', 'H3')),

        -- Infos bâtiment
        nb_appartements INTEGER,
        nb_batiments INTEGER DEFAULT 1,
        nb_etages INTEGER,
        annee_construction INTEGER,
        type_chauffage TEXT,
        nature_reseau TEXT CHECK (nature_reseau IN ('Acier', 'Cuivre', 'Multicouche', 'Synthetique')),
        puissance_nominale_kw INTEGER,

        -- Contact sur place
        gardien_nom TEXT,
        gardien_tel TEXT,
        acces_info TEXT,
        digicode TEXT,

        -- Métadonnées
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    results.push('✓ Created chantiers table')

    // 3. Modifier interventions pour le workflow complet
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS demandeur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS date_demande TIMESTAMPTZ DEFAULT now()`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS date_planifiee DATE`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS heure_debut TIME`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS heure_fin TIME`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente'))`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS commentaire_installateur TEXT`
    await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS commentaire_admin TEXT`

    // Modifier le statut pour inclure le workflow complet
    await sql`ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_statut_check`
    await sql`
      ALTER TABLE interventions
      ADD CONSTRAINT interventions_statut_check
      CHECK (statut IN ('demande', 'planifiee', 'en_cours', 'terminee', 'annulee', 'facturee', 'payee'))
    `
    // Mettre à jour les anciens statuts
    await sql`UPDATE interventions SET statut = 'demande' WHERE statut = 'brouillon'`
    await sql`UPDATE interventions SET statut = 'planifiee' WHERE statut = 'edite'`
    await sql`UPDATE interventions SET statut = 'terminee' WHERE statut = 'envoye'`
    await sql`UPDATE interventions SET statut = 'facturee' WHERE statut = 'facture'`
    await sql`UPDATE interventions SET statut = 'payee' WHERE statut = 'paye'`
    results.push('✓ Updated interventions table with workflow fields')

    // 4. Lier clients_finaux à l'installateur (user)
    await sql`ALTER TABLE clients_finaux ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
    results.push('✓ Added created_by to clients_finaux')

    // 5. Lier rapports aux chantiers et interventions
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL`
    await sql`ALTER TABLE rapports_desembouage ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL`
    results.push('✓ Added chantier_id to rapport tables')

    // 6. Table techniciens simplifiée (lien user -> infos technicien)
    await sql`ALTER TABLE techniciens ADD COLUMN IF NOT EXISTS disponible BOOLEAN DEFAULT true`
    await sql`ALTER TABLE techniciens ADD COLUMN IF NOT EXISTS zone_intervention TEXT`
    results.push('✓ Updated techniciens table')

    // 7. Index
    await sql`CREATE INDEX IF NOT EXISTS idx_chantiers_client ON chantiers(client_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_interventions_chantier ON interventions(chantier_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_interventions_demandeur ON interventions(demandeur_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_interventions_date_planifiee ON interventions(date_planifiee)`
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients_finaux(created_by)`
    results.push('✓ Created indexes')

    // 8. RLS pour chantiers
    await sql`ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY`
    try { await sql`DROP POLICY IF EXISTS "chantiers_authenticated" ON chantiers` } catch {}
    await sql`CREATE POLICY "chantiers_authenticated" ON chantiers FOR ALL TO authenticated USING (true) WITH CHECK (true)`
    results.push('✓ Enabled RLS on chantiers')

    // 9. Trigger updated_at pour chantiers
    await sql.unsafe(`DROP TRIGGER IF EXISTS update_chantiers_updated_at ON chantiers`)
    await sql.unsafe(`CREATE TRIGGER update_chantiers_updated_at BEFORE UPDATE ON chantiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`)
    results.push('✓ Created trigger for chantiers')

    console.log('\n=== Migration Phase 2B Complete ===\n')
    results.forEach(r => console.log(r))
    console.log('\n')

  } catch (err) {
    console.error('Migration error:', err)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

migrate()
