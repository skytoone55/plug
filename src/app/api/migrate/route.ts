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
      results.push('Connected to database')

      // Add missing columns
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS fiche TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS type_installation TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_beneficiaire TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siren_prestataire TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS intervenant_nom TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS siret_intervenant TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS surface_chauffee NUMERIC`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS releves_site TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS considerations TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS nom_equipement TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS temperature_exterieure TEXT`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_site JSONB DEFAULT '[]'`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_vannes JSONB DEFAULT '[]'`
      await sql`ALTER TABLE rapports_equilibrage ADD COLUMN IF NOT EXISTS photos_autres JSONB DEFAULT '[]'`
      results.push('Added missing columns')

      // Fix RLS
      await sql`DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles`
      await sql`DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles`
      await sql`DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles`
      await sql`DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles`
      try { await sql`CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated USING (true)` } catch { results.push('user_profiles_select exists') }
      try { await sql`CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid())` } catch { results.push('user_profiles_update exists') }
      try { await sql`CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid())` } catch { results.push('user_profiles_insert exists') }

      await sql`DROP POLICY IF EXISTS "Users can view own rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Admins can view all rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Users can insert rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Users can update own rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Admins can manage rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Users can delete own rapports" ON rapports_equilibrage`
      await sql`DROP POLICY IF EXISTS "Admins can delete rapports" ON rapports_equilibrage`
      try { await sql`CREATE POLICY "rapports_eq_select" ON rapports_equilibrage FOR SELECT TO authenticated USING (true)` } catch { results.push('rapports_eq_select exists') }
      try { await sql`CREATE POLICY "rapports_eq_insert" ON rapports_equilibrage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)` } catch { results.push('rapports_eq_insert exists') }
      try { await sql`CREATE POLICY "rapports_eq_update" ON rapports_equilibrage FOR UPDATE TO authenticated USING (true)` } catch { results.push('rapports_eq_update exists') }
      try { await sql`CREATE POLICY "rapports_eq_delete" ON rapports_equilibrage FOR DELETE TO authenticated USING (true)` } catch { results.push('rapports_eq_delete exists') }

      await sql`DROP POLICY IF EXISTS "Users can view own rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Admins can view all rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Users can insert rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Users can update own rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Admins can manage rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Users can delete own rapports desembouage" ON rapports_desembouage`
      await sql`DROP POLICY IF EXISTS "Admins can delete rapports desembouage" ON rapports_desembouage`
      try { await sql`CREATE POLICY "rapports_de_select" ON rapports_desembouage FOR SELECT TO authenticated USING (true)` } catch { results.push('rapports_de_select exists') }
      try { await sql`CREATE POLICY "rapports_de_insert" ON rapports_desembouage FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)` } catch { results.push('rapports_de_insert exists') }
      try { await sql`CREATE POLICY "rapports_de_update" ON rapports_desembouage FOR UPDATE TO authenticated USING (true)` } catch { results.push('rapports_de_update exists') }
      try { await sql`CREATE POLICY "rapports_de_delete" ON rapports_desembouage FOR DELETE TO authenticated USING (true)` } catch { results.push('rapports_de_delete exists') }
      results.push('Fixed RLS policies')

      // Storage
      await sql`DROP POLICY IF EXISTS "Auth users can upload" ON storage.objects`
      await sql`DROP POLICY IF EXISTS "Auth users can read" ON storage.objects`
      await sql`DROP POLICY IF EXISTS "Public read photos" ON storage.objects`
      try { await sql`CREATE POLICY "photos_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos')` } catch { results.push('photos_public_select exists') }
      try { await sql`CREATE POLICY "photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos')` } catch { results.push('photos_auth_insert exists') }
      try { await sql`CREATE POLICY "photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos')` } catch { results.push('photos_auth_update exists') }
      try { await sql`CREATE POLICY "photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos')` } catch { results.push('photos_auth_delete exists') }
      results.push('Fixed storage policies')

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
