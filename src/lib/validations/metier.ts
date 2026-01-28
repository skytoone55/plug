/**
 * Validations Métier PLUG2DRIVE
 * Conformité au Cahier des Charges (CDC) §10.3
 */

import type { RapportEquilibrage, RapportDesembouage } from '@/lib/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================
// VALIDATIONS ÉQUILIBRAGE (CDC §6.2)
// ============================================

export function validerEquilibrage(data: Partial<RapportEquilibrage>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // === 1. Écart max température < 2°C (exigence CEE - CDC §10.3) ===
  if (data.tab_mesure_temperature && data.tab_mesure_temperature.length > 1) {
    const temps = data.tab_mesure_temperature
      .map(t => parseFloat(t.temperatureMesuree))
      .filter(t => !isNaN(t))

    if (temps.length > 1) {
      const ecartMax = Math.max(...temps) - Math.min(...temps)
      if (ecartMax >= 2) {
        errors.push(`Écart de température trop important (${ecartMax.toFixed(1)}°C). Maximum autorisé selon CEE: 2°C`)
      } else if (ecartMax >= 1.5) {
        warnings.push(`Écart de température élevé (${ecartMax.toFixed(1)}°C). Recommandé: < 1.5°C`)
      }
    }
  }

  // === 2. Au moins une vanne saisie ===
  if (!data.tab_mesure_debit || data.tab_mesure_debit.length === 0) {
    errors.push('Au moins une vanne doit être saisie pour un rapport d\'équilibrage')
  }

  // === 3. Au moins un relevé température par bâtiment ===
  if (data.tab_mesure_debit && data.tab_mesure_debit.length > 0) {
    const batimentsVannes = [...new Set(data.tab_mesure_debit.map(v => v.batimentNo).filter(Boolean))]
    const batimentsTemps = [...new Set(data.tab_mesure_temperature?.map(t => t.batimentNo).filter(Boolean) || [])]
    const batimentsSansTemp = batimentsVannes.filter(b => !batimentsTemps.includes(b))

    if (batimentsSansTemp.length > 0) {
      errors.push(`Relevé de température manquant pour le(s) bâtiment(s): ${batimentsSansTemp.join(', ')}`)
    }
  }

  // === 4. Photo façade obligatoire (CDC §6.2 Section 4) ===
  if (!data.photo_facade) {
    errors.push('Photo de façade obligatoire pour la conformité CEE')
  }

  // === 5. Champs conditionnels selon fiche CEE ===
  if (data.intitule_cee === 'BAT-SE-103') {
    if (!data.surface_chauffee_m2 || data.surface_chauffee_m2 <= 0) {
      errors.push('Surface chauffée (m²) obligatoire pour la fiche BAT-SE-103 (tertiaire)')
    }
  }

  if (data.intitule_cee === 'BAR-SE-104') {
    if (!data.nombre_lots || data.nombre_lots <= 0) {
      errors.push('Nombre de lots obligatoire pour la fiche BAR-SE-104 (résidentiel)')
    }
  }

  // === 6. Vérification conformité des vannes ===
  if (data.tab_mesure_debit && data.tab_mesure_debit.length > 0) {
    const vannesNC = data.tab_mesure_debit.filter(v => v.conformite === 'NC')
    if (vannesNC.length > 0) {
      warnings.push(`${vannesNC.length} vanne(s) non conforme(s) détectée(s)`)
    }

    const vannesNE = data.tab_mesure_debit.filter(v => v.conformite === 'NE')
    if (vannesNE.length > 0) {
      warnings.push(`${vannesNE.length} vanne(s) non exécutée(s)`)
    }
  }

  // === 7. Vérification écart débit théorique/mesuré ===
  if (data.tab_mesure_debit && data.tab_mesure_debit.length > 0) {
    const ecartsMajeurs = data.tab_mesure_debit.filter(v => {
      const theo = parseFloat(v.debitTheorique)
      const mes = parseFloat(v.debitMesure)
      if (!isNaN(theo) && !isNaN(mes) && theo > 0) {
        const ecart = Math.abs(mes - theo) / theo * 100
        return ecart > 20 // Plus de 20% d'écart
      }
      return false
    })

    if (ecartsMajeurs.length > 0) {
      warnings.push(`${ecartsMajeurs.length} vanne(s) avec écart débit > 20%`)
    }
  }

  // === 8. Technicien et date d'intervention ===
  if (!data.technicien_nom || data.technicien_nom.trim() === '') {
    warnings.push('Nom du technicien non renseigné')
  }

  if (!data.technicien_date_intervention) {
    warnings.push('Date d\'intervention non renseignée')
  }

  // === 9. Signatures ===
  if (!data.signature_technicien) {
    warnings.push('Signature du technicien manquante')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// VALIDATIONS DÉSEMBOUAGE (CDC §5.2)
// ============================================

export function validerDesembouage(data: Partial<RapportDesembouage>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // === 1. pH après < pH avant (CDC §10.3) ===
  if (data.ph_apres_traitement != null && data.ph_avant_traitement != null) {
    if (data.ph_apres_traitement >= data.ph_avant_traitement) {
      errors.push(
        `Le pH après traitement (${data.ph_apres_traitement}) doit être inférieur au pH avant traitement (${data.ph_avant_traitement}) pour valider l'efficacité du désembouage`
      )
    }
  }

  // === 2. Durée traitement 3-15 jours (CDC §5.2 Section 6) ===
  if (data.duree_traitement_jours != null) {
    if (data.duree_traitement_jours < 3) {
      errors.push('La durée de traitement doit être d\'au moins 3 jours selon le CDC')
    } else if (data.duree_traitement_jours > 15) {
      errors.push('La durée de traitement ne doit pas dépasser 15 jours selon le CDC')
    }
  }

  // === 3. Photos obligatoires (CDC) ===
  if (!data.photos_produits || data.photos_produits.length === 0) {
    errors.push('Photos des produits/chaudière obligatoires')
  }

  if (!data.vue_aerienne) {
    errors.push('Vue aérienne obligatoire pour la conformité CEE')
  }

  if (!data.photos_batiments || data.photos_batiments.length === 0) {
    errors.push('Photos des bâtiments obligatoires')
  }

  // === 4. Vérification des volumes calculés ===
  if (data.site_nb_appartements && data.site_nb_appartements > 0) {
    const volumeAttendu = data.site_nb_appartements * 80 // 80L par appartement
    if (data.volume_eau_estimatif && Math.abs(data.volume_eau_estimatif - volumeAttendu) > volumeAttendu * 0.1) {
      warnings.push(`Le volume estimatif (${data.volume_eau_estimatif}L) diffère de la valeur calculée (${volumeAttendu}L)`)
    }
  }

  // === 5. Quantité désembouant vs volume ===
  if (data.volume_total_eau && data.volume_total_eau > 0 && data.quantite_desembouant_l) {
    const volumeM3 = data.volume_total_eau / 1000
    const qteRecommandee = volumeM3 * 5 // 5L par m³

    if (data.quantite_desembouant_l < qteRecommandee * 0.8) {
      warnings.push(`Quantité de désembouant (${data.quantite_desembouant_l}L) potentiellement insuffisante. Recommandé: ${qteRecommandee.toFixed(1)}L`)
    }
  }

  // === 6. Nature du réseau ===
  if (!data.nature_reseau) {
    warnings.push('Nature du réseau non renseignée')
  }

  // === 7. Technicien et date d'intervention ===
  if (!data.technicien_nom || data.technicien_nom.trim() === '') {
    warnings.push('Nom du technicien non renseigné')
  }

  if (!data.technicien_date_intervention) {
    warnings.push('Date d\'intervention non renseignée')
  }

  // === 8. Signatures ===
  if (!data.signature_technicien) {
    warnings.push('Signature du technicien manquante')
  }

  // === 9. Document fabricant (CDC §5.2 Section 9) ===
  if (!data.document_fabricant) {
    warnings.push('Document fabricant (fiche technique produit) non fourni')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// VALIDATION AVANT GÉNÉRATION PDF
// ============================================

export function validerPourPDF(
  type: 'equilibrage' | 'desembouage',
  data: Partial<RapportEquilibrage> | Partial<RapportDesembouage>
): ValidationResult {
  const baseValidation = type === 'equilibrage'
    ? validerEquilibrage(data as Partial<RapportEquilibrage>)
    : validerDesembouage(data as Partial<RapportDesembouage>)

  const errors = [...baseValidation.errors]
  const warnings = [...baseValidation.warnings]

  // Vérifications communes pour PDF
  const commonData = data as {
    beneficiaire_nom?: string | null
    site_adresse?: string | null
    technicien_nom?: string | null
    technicien_date_intervention?: string | null
  }

  if (!commonData.beneficiaire_nom || commonData.beneficiaire_nom.trim() === '') {
    errors.push('Nom du bénéficiaire obligatoire pour générer le PDF')
  }

  if (!commonData.site_adresse || commonData.site_adresse.trim() === '') {
    errors.push('Adresse du site obligatoire pour générer le PDF')
  }

  if (!commonData.technicien_date_intervention) {
    errors.push('Date d\'intervention obligatoire pour générer le PDF')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// VALIDATION TRANSITION STATUT (CDC §10)
// ============================================

export const TRANSITIONS_STATUTS: Record<string, string[]> = {
  brouillon: ['edite'],
  edite: ['brouillon', 'envoye'],
  envoye: ['edite', 'facture'],
  facture: ['paye'],
  paye: [],
}

export function peutTransitionner(statutActuel: string, nouveauStatut: string): boolean {
  return TRANSITIONS_STATUTS[statutActuel]?.includes(nouveauStatut) ?? false
}

export function validerTransition(
  type: 'equilibrage' | 'desembouage',
  data: Partial<RapportEquilibrage> | Partial<RapportDesembouage>,
  nouveauStatut: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const statutActuel = (data as { statut?: string }).statut || 'brouillon'

  // Vérifier si la transition est autorisée
  if (!peutTransitionner(statutActuel, nouveauStatut)) {
    errors.push(`Transition non autorisée: ${statutActuel} → ${nouveauStatut}`)
    return { valid: false, errors, warnings }
  }

  // Validations spécifiques par transition
  if (nouveauStatut === 'edite') {
    // Pour passer en "édité", le rapport doit être complet
    const validation = validerPourPDF(type, data)
    errors.push(...validation.errors)
    warnings.push(...validation.warnings)
  }

  if (nouveauStatut === 'envoye') {
    // Pour envoyer, les signatures doivent être présentes
    const signData = data as { signature_technicien?: string | null; signature_client?: string | null }
    if (!signData.signature_technicien) {
      errors.push('Signature du technicien requise avant envoi')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
