import postgres from 'postgres'

const sql = postgres({
  host: 'db.bnfudxssdnphfbqcoext.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@Supabase1532',
  ssl: 'require',
  connect_timeout: 15,
})

async function main() {
  console.log('🚀 Ajout des statuts aux chantiers et rapports...')

  try {
    // Ajouter statut au chantier
    await sql`
      ALTER TABLE chantiers
      ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente'
      CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule'))
    `
    console.log('✅ Colonne statut ajoutée aux chantiers')

    // Ajouter statut et réclamation aux rapports équilibrage
    await sql`
      ALTER TABLE rapports_equilibrage
      ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_preparation'
      CHECK (statut IN ('en_preparation', 'pret', 'livre', 'conteste'))
    `
    await sql`
      ALTER TABLE rapports_equilibrage
      ADD COLUMN IF NOT EXISTS reclamation_note TEXT
    `
    await sql`
      ALTER TABLE rapports_equilibrage
      ADD COLUMN IF NOT EXISTS reclamation_date TIMESTAMPTZ
    `
    console.log('✅ Colonnes statut et réclamation ajoutées aux rapports équilibrage')

    // Ajouter statut et réclamation aux rapports désembouage
    await sql`
      ALTER TABLE rapports_desembouage
      ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_preparation'
      CHECK (statut IN ('en_preparation', 'pret', 'livre', 'conteste'))
    `
    await sql`
      ALTER TABLE rapports_desembouage
      ADD COLUMN IF NOT EXISTS reclamation_note TEXT
    `
    await sql`
      ALTER TABLE rapports_desembouage
      ADD COLUMN IF NOT EXISTS reclamation_date TIMESTAMPTZ
    `
    console.log('✅ Colonnes statut et réclamation ajoutées aux rapports désembouage')

    console.log('✅ Migration terminée!')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await sql.end()
  }
}

main()
