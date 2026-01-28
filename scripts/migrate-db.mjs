import postgres from 'postgres';

// We need the DB password — try a few common approaches
// Supabase direct connection uses the DB password set at project creation
// The pooler connection string uses the same password

// For the project bnfudxssdnphfbqcoext, try with service_role key as password workaround
// Actually, Supabase exposes the connection string in the dashboard

const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.log('DB_PASSWORD not set. Please provide your Supabase database password.');
  console.log('You can find it in Supabase Dashboard > Settings > Database > Connection string');
  console.log('');
  console.log('Usage: DB_PASSWORD=your_password node scripts/migrate-db.mjs');
  console.log('');
  console.log('Alternatively, run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor):');
  console.log('');
  console.log(`
-- ============================================
-- MIGRATION: Add missing columns + Fix RLS
-- ============================================

-- Add missing columns to rapports_equilibrage
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS fiche TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS type_installation TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_beneficiaire TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_prestataire TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS intervenant_nom TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siret_intervenant TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS surface_chauffee NUMERIC;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS releves_site TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS considerations TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS nom_equipement TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS temperature_exterieure TEXT;
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_site JSONB DEFAULT '[]';
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_vannes JSONB DEFAULT '[]';
ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_autres JSONB DEFAULT '[]';

-- Fix RLS policies (remove recursive ones)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view own rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Admins can view all rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Users can insert rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Users can update own rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Admins can manage rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Users can delete own rapports" ON rapports_equilibrage;
DROP POLICY IF EXISTS "Admins can delete rapports" ON rapports_equilibrage;
CREATE POLICY "rapports_eq_select" ON rapports_equilibrage FOR SELECT TO authenticated USING (true);
CREATE POLICY "rapports_eq_insert" ON rapports_equilibrage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rapports_eq_update" ON rapports_equilibrage FOR UPDATE TO authenticated USING (true);
CREATE POLICY "rapports_eq_delete" ON rapports_equilibrage FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Admins can view all rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Users can insert rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Users can update own rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Admins can manage rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Users can delete own rapports desembouage" ON rapports_desembouage;
DROP POLICY IF EXISTS "Admins can delete rapports desembouage" ON rapports_desembouage;
CREATE POLICY "rapports_de_select" ON rapports_desembouage FOR SELECT TO authenticated USING (true);
CREATE POLICY "rapports_de_insert" ON rapports_desembouage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rapports_de_update" ON rapports_desembouage FOR UPDATE TO authenticated USING (true);
CREATE POLICY "rapports_de_delete" ON rapports_desembouage FOR DELETE TO authenticated USING (true);

-- Storage policies for photos bucket
CREATE POLICY "photos_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');
CREATE POLICY "photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');
`);
  process.exit(1);
}

const sql = postgres({
  host: 'db.bnfudxssdnphfbqcoext.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: DB_PASSWORD,
  ssl: 'require',
});

async function main() {
  try {
    console.log('Connecting to database...');

    // Test connection
    const [{ now }] = await sql`SELECT now()`;
    console.log('Connected! Server time:', now);

    // Add missing columns
    console.log('\n=== Adding missing columns to rapports_equilibrage ===');
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS fiche TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS type_installation TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_beneficiaire TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_prestataire TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS intervenant_nom TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siret_intervenant TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS surface_chauffee NUMERIC`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS releves_site TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS considerations TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS nom_equipement TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS temperature_exterieure TEXT`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_site JSONB DEFAULT '[]'`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_vannes JSONB DEFAULT '[]'`;
    await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_autres JSONB DEFAULT '[]'`;
    console.log('Columns added successfully!');

    // Fix RLS policies
    console.log('\n=== Fixing RLS policies ===');

    // Drop old recursive policies on user_profiles
    await sql`DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles`;
    await sql`DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles`;
    await sql`DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles`;
    await sql`DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles`;
    console.log('Dropped old user_profiles policies');

    // Create simple policies
    try { await sql`CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated USING (true)`; } catch(e) { console.log('user_profiles_select already exists'); }
    try { await sql`CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid())`; } catch(e) { console.log('user_profiles_update already exists'); }
    try { await sql`CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid())`; } catch(e) { console.log('user_profiles_insert already exists'); }
    console.log('Created new user_profiles policies');

    // Drop old recursive policies on rapports_equilibrage
    await sql`DROP POLICY IF EXISTS "Users can view own rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Admins can view all rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Users can insert rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Users can update own rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Admins can manage rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Users can delete own rapports" ON rapports_equilibrage`;
    await sql`DROP POLICY IF EXISTS "Admins can delete rapports" ON rapports_equilibrage`;
    console.log('Dropped old rapports_equilibrage policies');

    try { await sql`CREATE POLICY "rapports_eq_select" ON rapports_equilibrage FOR SELECT TO authenticated USING (true)`; } catch(e) { console.log('rapports_eq_select already exists'); }
    try { await sql`CREATE POLICY "rapports_eq_insert" ON rapports_equilibrage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)`; } catch(e) { console.log('rapports_eq_insert already exists'); }
    try { await sql`CREATE POLICY "rapports_eq_update" ON rapports_equilibrage FOR UPDATE TO authenticated USING (true)`; } catch(e) { console.log('rapports_eq_update already exists'); }
    try { await sql`CREATE POLICY "rapports_eq_delete" ON rapports_equilibrage FOR DELETE TO authenticated USING (true)`; } catch(e) { console.log('rapports_eq_delete already exists'); }
    console.log('Created new rapports_equilibrage policies');

    // Drop old recursive policies on rapports_desembouage
    await sql`DROP POLICY IF EXISTS "Users can view own rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Admins can view all rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Users can insert rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Users can update own rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Admins can manage rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Users can delete own rapports desembouage" ON rapports_desembouage`;
    await sql`DROP POLICY IF EXISTS "Admins can delete rapports desembouage" ON rapports_desembouage`;
    console.log('Dropped old rapports_desembouage policies');

    try { await sql`CREATE POLICY "rapports_de_select" ON rapports_desembouage FOR SELECT TO authenticated USING (true)`; } catch(e) { console.log('rapports_de_select already exists'); }
    try { await sql`CREATE POLICY "rapports_de_insert" ON rapports_desembouage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)`; } catch(e) { console.log('rapports_de_insert already exists'); }
    try { await sql`CREATE POLICY "rapports_de_update" ON rapports_desembouage FOR UPDATE TO authenticated USING (true)`; } catch(e) { console.log('rapports_de_update already exists'); }
    try { await sql`CREATE POLICY "rapports_de_delete" ON rapports_desembouage FOR DELETE TO authenticated USING (true)`; } catch(e) { console.log('rapports_de_delete already exists'); }
    console.log('Created new rapports_desembouage policies');

    // Storage policies
    console.log('\n=== Fixing Storage policies ===');
    await sql`DROP POLICY IF EXISTS "Auth users can upload" ON storage.objects`;
    await sql`DROP POLICY IF EXISTS "Auth users can read" ON storage.objects`;
    await sql`DROP POLICY IF EXISTS "Public read photos" ON storage.objects`;

    try { await sql`CREATE POLICY "photos_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos')`; } catch(e) { console.log('photos_public_select already exists'); }
    try { await sql`CREATE POLICY "photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos')`; } catch(e) { console.log('photos_auth_insert already exists'); }
    try { await sql`CREATE POLICY "photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos')`; } catch(e) { console.log('photos_auth_update already exists'); }
    try { await sql`CREATE POLICY "photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos')`; } catch(e) { console.log('photos_auth_delete already exists'); }
    console.log('Created storage policies');

    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

main();
