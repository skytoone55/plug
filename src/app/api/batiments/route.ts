import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Liste des bâtiments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client_final_id = searchParams.get('client_final_id')
    const ville = searchParams.get('ville')
    const actif = searchParams.get('actif')

    let query = supabaseAdmin
      .from('batiments')
      .select('*, clients_finaux(nom, type)')
      .order('nom', { ascending: true })

    if (client_final_id) {
      query = query.eq('client_final_id', client_final_id)
    }
    if (ville) {
      query = query.ilike('ville', `%${ville}%`)
    }
    if (actif !== null) {
      query = query.eq('actif', actif === 'true')
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un bâtiment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = { ...body, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('batiments')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un bâtiment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const payload = { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('batiments')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un bâtiment
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('batiments')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
