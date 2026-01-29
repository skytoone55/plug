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
  console.log('🚀 Correction de la contrainte de rôle...')

  try {
    await sql`SELECT 1`
    console.log('✅ Connecté')

    // Supprimer l'ancienne contrainte
    await sql`
      ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_role_check
    `
    console.log('✅ Ancienne contrainte supprimée')

    // Ajouter la nouvelle contrainte avec "installateur" au lieu de "utilisateur"
    await sql`
      ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_role_check
      CHECK (role IN ('admin', 'installateur', 'technicien'))
    `
    console.log('✅ Nouvelle contrainte ajoutée (admin, installateur, technicien)')

    // Mettre à jour les anciens "utilisateur" en "installateur"
    await sql`
      UPDATE user_profiles
      SET role = 'installateur'
      WHERE role = 'utilisateur'
    `
    console.log('✅ Anciens rôles "utilisateur" convertis en "installateur"')

    console.log('✅ Migration terminée!')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await sql.end()
  }
}

migrate()
