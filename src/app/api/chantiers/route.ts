import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Liste des chantiers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    const created_by = searchParams.get('created_by')
    const actif = searchParams.get('actif')

    // Si filtrage par created_by, on doit d'abord récupérer les IDs des clients
    let clientIds: string[] | null = null
    if (created_by) {
      const { data: clients } = await supabaseAdmin
        .from('clients_finaux')
        .select('id')
        .eq('created_by', created_by)
      clientIds = clients?.map(c => c.id) || []
    }

    let query = supabaseAdmin
      .from('chantiers')
      .select(`
        *,
        clients_finaux(id, nom, type, installateurs(nom))
      `)
      .order('created_at', { ascending: false })

    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    if (clientIds !== null) {
      if (clientIds.length === 0) {
        // Aucun client trouvé, retourner tableau vide
        return NextResponse.json([])
      }
      query = query.in('client_id', clientIds)
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

// POST - Créer un chantier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = { ...body, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('chantiers')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un chantier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const payload = { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('chantiers')
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

// DELETE - Supprimer un chantier
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('chantiers')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
