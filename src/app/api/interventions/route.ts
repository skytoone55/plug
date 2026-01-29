import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { genererNumeroDossier } from '@/lib/utils/numerotation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Liste des interventions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chantier_id = searchParams.get('chantier_id')
    const technicien_id = searchParams.get('technicien_id')
    const demandeur_id = searchParams.get('demandeur_id')
    const type = searchParams.get('type')
    const statut = searchParams.get('statut')
    const statuts = searchParams.get('statuts') // Plusieurs statuts séparés par virgule

    let query = supabaseAdmin
      .from('interventions')
      .select(`
        *,
        chantiers(id, nom, adresse, adresse_complement, code_postal, ville, gardien_nom, gardien_tel, digicode, acces_info, nb_appartements, clients_finaux(nom)),
        techniciens(id, nom, prenom, telephone)
      `)
      .order('date_planifiee', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (chantier_id) {
      query = query.eq('chantier_id', chantier_id)
    }
    if (technicien_id) {
      query = query.eq('technicien_id', technicien_id)
    }
    if (demandeur_id) {
      query = query.eq('demandeur_id', demandeur_id)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (statut) {
      query = query.eq('statut', statut)
    }
    if (statuts) {
      query = query.in('statut', statuts.split(','))
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une intervention (demande ou création admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Générer automatiquement le numéro de dossier si non fourni
    let numeroDossier = body.numero_dossier
    if (!numeroDossier) {
      numeroDossier = await genererNumeroDossier()
    }

    // Si pas de statut, c'est une demande d'installateur
    const statut = body.statut || 'demande'
    const date_demande = body.date_demande || new Date().toISOString()

    const payload = {
      ...body,
      numero_dossier: numeroDossier,
      statut,
      date_demande,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('interventions')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une intervention
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const payload = { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('interventions')
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

// DELETE - Supprimer une intervention
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('interventions')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
