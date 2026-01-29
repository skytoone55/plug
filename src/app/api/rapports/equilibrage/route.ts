import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Liste des rapports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const chantier_id = searchParams.get('chantier_id')

    let query = supabaseAdmin
      .from('rapports_equilibrage')
      .select(`
        *,
        chantiers(id, nom, adresse, ville, clients_finaux(nom))
      `)
      .order('created_at', { ascending: false })

    if (id) {
      query = query.eq('id', id)
    }
    if (chantier_id) {
      query = query.eq('chantier_id', chantier_id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Create rapport
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = { ...body, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('rapports_equilibrage')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update rapport
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const payload = { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('rapports_equilibrage')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Delete rapport
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('rapports_equilibrage')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
