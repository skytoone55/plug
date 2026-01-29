/**
 * Utilitaires de numérotation automatique PLUG2DRIVE
 * Format: PLUG-{ANNEE}-{SEQUENCE:6 digits}
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * Génère un nouveau numéro de dossier unique
 * Format: PLUG-2026-000001, PLUG-2026-000002, etc.
 */
export async function genererNumeroDossier(): Promise<string> {
  const supabase = getSupabaseAdmin()
  const annee = new Date().getFullYear()
  const prefix = `PLUG-${annee}-`

  const { data, error } = await supabase
    .from('interventions')
    .select('numero_dossier')
    .like('numero_dossier', `${prefix}%`)
    .order('numero_dossier', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur récupération dernier numéro:', error)
    // Fallback avec timestamp
    return `${prefix}${Date.now().toString().slice(-6)}`
  }

  let numero = 1
  if (data && data.length > 0 && data[0].numero_dossier) {
    const dernierNumero = data[0].numero_dossier
    const match = dernierNumero.match(/PLUG-\d{4}-(\d{6})/)
    if (match) {
      numero = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}${numero.toString().padStart(6, '0')}`
}

/**
 * Vérifie si un numéro de dossier existe déjà
 */
export async function numeroDossierExiste(numeroDossier: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('interventions')
    .select('id')
    .eq('numero_dossier', numeroDossier)
    .limit(1)

  if (error) {
    console.error('Erreur vérification numéro:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * Génère un identifiant court pour les rapports (legacy)
 * Format: EQ-{timestamp}-{random}
 */
export function genererIdCourt(type: 'equilibrage' | 'desembouage'): string {
  const prefix = type === 'equilibrage' ? 'EQ' : 'DE'
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}
