import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Liste des clients finaux
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const installateur_id = searchParams.get('installateur_id')
    const created_by = searchParams.get('created_by')
    const type = searchParams.get('type')
    const actif = searchParams.get('actif')

    let query = supabaseAdmin
      .from('clients_finaux')
      .select('*, installateurs(nom)')
      .order('nom', { ascending: true })

    if (installateur_id) {
      query = query.eq('installateur_id', installateur_id)
    }
    if (created_by) {
      query = query.eq('created_by', created_by)
    }
    if (type) {
      query = query.eq('type', type)
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

// POST - Créer un client final
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = { ...body, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('clients_finaux')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un client final
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const payload = { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('clients_finaux')
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

// DELETE - Supprimer un client final
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('clients_finaux')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
