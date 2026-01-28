const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bnfudxssdnphfbqcoext.supabase.co',
  'sb_secret_ybTutqQta4fKC0GfOyQ64Q_kEhQ_xk0'
);

async function run() {
  console.log('=== Migration: Add missing columns to rapports_equilibrage ===');

  // We can't run DDL via PostgREST, so we'll create a temporary RPC function
  // Actually, let's try the pgmeta endpoint

  // Alternative approach: use the fetch API to call the Supabase SQL API
  const url = 'https://bnfudxssdnphfbqcoext.supabase.co';
  const key = 'sb_secret_ybTutqQta4fKC0GfOyQ64Q_kEhQ_xk0';

  const sqlStatements = [
    // Add missing columns to rapports_equilibrage
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS fiche TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS type_installation TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_beneficiaire TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_prestataire TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS intervenant_nom TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siret_intervenant TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS surface_chauffee NUMERIC",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS releves_site TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS considerations TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS nom_equipement TEXT",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS temperature_exterieure TEXT",
    // Change photo columns to match original: photos_site, photos_vannes, photos_autres
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_site JSONB DEFAULT '[]'",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_vannes JSONB DEFAULT '[]'",
    "ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_autres JSONB DEFAULT '[]'",

    // Drop old RLS policies on all tables
    "DROP POLICY IF EXISTS \"Users can view own profile\" ON user_profiles",
    "DROP POLICY IF EXISTS \"Users can update own profile\" ON user_profiles",
    "DROP POLICY IF EXISTS \"Admins can view all profiles\" ON user_profiles",
    "DROP POLICY IF EXISTS \"Admins can manage profiles\" ON user_profiles",
    "DROP POLICY IF EXISTS \"Users can view own rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Admins can view all rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Users can insert rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Users can update own rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Admins can manage rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Users can delete own rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Admins can delete rapports\" ON rapports_equilibrage",
    "DROP POLICY IF EXISTS \"Users can view own rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Admins can view all rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Users can insert rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Users can update own rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Admins can manage rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Users can delete own rapports desembouage\" ON rapports_desembouage",
    "DROP POLICY IF EXISTS \"Admins can delete rapports desembouage\" ON rapports_desembouage",

    // Create simple non-recursive policies
    "CREATE POLICY \"user_profiles_select\" ON user_profiles FOR SELECT TO authenticated USING (true)",
    "CREATE POLICY \"user_profiles_update\" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid())",
    "CREATE POLICY \"user_profiles_insert\" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid())",
    "CREATE POLICY \"rapports_eq_select\" ON rapports_equilibrage FOR SELECT TO authenticated USING (true)",
    "CREATE POLICY \"rapports_eq_insert\" ON rapports_equilibrage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)",
    "CREATE POLICY \"rapports_eq_update\" ON rapports_equilibrage FOR UPDATE TO authenticated USING (true)",
    "CREATE POLICY \"rapports_eq_delete\" ON rapports_equilibrage FOR DELETE TO authenticated USING (true)",
    "CREATE POLICY \"rapports_de_select\" ON rapports_desembouage FOR SELECT TO authenticated USING (true)",
    "CREATE POLICY \"rapports_de_insert\" ON rapports_desembouage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)",
    "CREATE POLICY \"rapports_de_update\" ON rapports_desembouage FOR UPDATE TO authenticated USING (true)",
    "CREATE POLICY \"rapports_de_delete\" ON rapports_desembouage FOR DELETE TO authenticated USING (true)",

    // Storage policies
    "DROP POLICY IF EXISTS \"Auth users can upload\" ON storage.objects",
    "DROP POLICY IF EXISTS \"Auth users can read\" ON storage.objects",
    "DROP POLICY IF EXISTS \"Public read photos\" ON storage.objects",
    "CREATE POLICY \"photos_public_select\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos')",
    "CREATE POLICY \"photos_auth_insert\" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos')",
    "CREATE POLICY \"photos_auth_update\" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos')",
    "CREATE POLICY \"photos_auth_delete\" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos')",
  ];

  // Execute each SQL via the pgmeta API (management API)
  for (const sql of sqlStatements) {
    try {
      const response = await fetch(`${url}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        const text = await response.text();
        // If it's a "function not found" error, we need a different approach
        if (text.includes('PGRST202')) {
          console.log('Need to create exec_sql function first');
          break;
        }
        console.log(`FAIL [${sql.substring(0, 60)}...]: ${text.substring(0, 100)}`);
      } else {
        console.log(`OK: ${sql.substring(0, 60)}...`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      break;
    }
  }
}

run();
