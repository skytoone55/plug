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

async function migrate() {
  console.log('🚀 Migration: Ajout type_travaux aux chantiers...')

  try {
    await sql`SELECT 1`
    console.log('✅ Connecté à la base de données')

    // Ajouter colonne type_travaux (array de text)
    await sql`
      ALTER TABLE chantiers
      ADD COLUMN IF NOT EXISTS type_travaux TEXT[] DEFAULT '{}'
    `
    console.log('✅ Colonne type_travaux ajoutée')

    // Ajouter chantier_id aux rapports d'équilibrage
    await sql`
      ALTER TABLE rapports_equilibrage
      ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id)
    `
    console.log('✅ chantier_id ajouté à rapports_equilibrage')

    // Ajouter chantier_id aux rapports de désembouage
    await sql`
      ALTER TABLE rapports_desembouage
      ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id)
    `
    console.log('✅ chantier_id ajouté à rapports_desembouage')

    console.log('✅ Migration terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await sql.end()
  }
}

migrate()
