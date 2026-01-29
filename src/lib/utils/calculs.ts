/**
 * Utilitaires de calculs métier PLUG2DRIVE
 * Conformité CDC §5.2 et §6.2
 */

import type { MesureDebit, MesureTemperature } from '@/lib/types'

// ============================================
// CALCULS ÉQUILIBRAGE (CDC §6.2)
// ============================================

/**
 * Calcule le nombre d'émetteurs estimé selon le nombre d'appartements
 * Ratio standard: 4 émetteurs par appartement
 */
export function calculerNbEmetteurs(nbAppartements: number): number {
  return nbAppartements * 4
}

/**
 * Calcule le débit total mesuré (somme des débits)
 */
export function calculerDebitTotal(mesures: MesureDebit[]): number {
  return mesures.reduce((sum, m) => {
    const debit = parseFloat(m.debitMesure)
    return sum + (isNaN(debit) ? 0 : debit)
  }, 0)
}

/**
 * Calcule le débit théorique total
 */
export function calculerDebitTheoriqueTotal(mesures: MesureDebit[]): number {
  return mesures.reduce((sum, m) => {
    const debit = parseFloat(m.debitTheorique)
    return sum + (isNaN(debit) ? 0 : debit)
  }, 0)
}

/**
 * Calcule l'écart moyen entre débit théorique et mesuré (en %)
 */
export function calculerEcartMoyen(mesures: MesureDebit[]): number {
  const ecarts = mesures
    .filter(m => {
      const theo = parseFloat(m.debitTheorique)
      const mes = parseFloat(m.debitMesure)
      return !isNaN(theo) && !isNaN(mes) && theo > 0
    })
    .map(m => {
      const theo = parseFloat(m.debitTheorique)
      const mes = parseFloat(m.debitMesure)
      return Math.abs(mes - theo) / theo * 100
    })

  return ecarts.length ? ecarts.reduce((a, b) => a + b, 0) / ecarts.length : 0
}

/**
 * Calcule l'écart max de température (CDC: doit être < 2°C)
 */
export function calculerEcartTemperature(mesures: MesureTemperature[]): number {
  const temps = mesures
    .map(t => parseFloat(t.temperatureMesuree))
    .filter(t => !isNaN(t))

  if (temps.length < 2) return 0
  return Math.max(...temps) - Math.min(...temps)
}

/**
 * Détermine la conformité d'une vanne selon l'écart
 * @param ecartPourcent Écart en pourcentage entre théorique et mesuré
 * @returns Conformité: C (conforme), NC (non conforme)
 */
export function determinerConformiteVanne(ecartPourcent: number): 'C' | 'NC' {
  // Tolérance de 20% selon CDC
  return ecartPourcent <= 20 ? 'C' : 'NC'
}

/**
 * Statistiques globales d'équilibrage
 */
export function calculerStatistiquesEquilibrage(mesures: MesureDebit[]): {
  total: number
  conformes: number
  nonConformes: number
  nonExecutes: number
  tauxConformite: number
} {
  const total = mesures.length
  const conformes = mesures.filter(m => m.conformite === 'C').length
  const nonConformes = mesures.filter(m => m.conformite === 'NC').length
  const nonExecutes = mesures.filter(m => m.conformite === 'NE').length

  return {
    total,
    conformes,
    nonConformes,
    nonExecutes,
    tauxConformite: total > 0 ? (conformes / total) * 100 : 0,
  }
}

// ============================================
// CALCULS DÉSEMBOUAGE (CDC §5.2)
// ============================================

/**
 * Calcule le volume d'eau du circuit (en litres)
 * @param longueurTotalM Longueur totale des tuyaux en mètres
 * @param diametreMm Diamètre intérieur en mm
 */
export function calculerVolumeCircuit(longueurTotalM: number, diametreMm: number): number {
  const rayonM = (diametreMm / 2) / 1000
  return Math.PI * rayonM * rayonM * longueurTotalM * 1000
}

/**
 * Calcule le volume estimatif selon le nombre d'appartements
 * Ratio standard: 80 litres par appartement
 */
export function calculerVolumeEstimatif(nbAppartements: number): number {
  return nbAppartements * 80
}

/**
 * Calcule la quantité de désembouant nécessaire
 * Ratio: 5 litres par m³ d'eau
 */
export function calculerQuantiteDesembouant(volumeEauLitres: number): number {
  const volumeM3 = volumeEauLitres / 1000
  return volumeM3 * 5
}

/**
 * Calcule la quantité d'inhibiteur nécessaire
 * Ratio: 2 litres par m³ d'eau
 */
export function calculerQuantiteInhibiteur(volumeEauLitres: number): number {
  const volumeM3 = volumeEauLitres / 1000
  return volumeM3 * 2
}

/**
 * Évalue la qualité de l'eau selon TDS
 * @param tdsInitial TDS avant traitement (ppm)
 * @param tdsFinal TDS après traitement (ppm)
 */
export function evaluerQualiteEau(tdsInitial: number, tdsFinal: number): 'CONFORME' | 'NON_CONFORME' {
  // Conforme si TDS final < 50% du TDS initial ou < 500 ppm
  return tdsFinal < tdsInitial * 0.5 || tdsFinal < 500 ? 'CONFORME' : 'NON_CONFORME'
}

/**
 * Évalue l'efficacité du traitement selon le pH
 * CDC §10.3: pH après doit être < pH avant
 */
export function evaluerEfficacitePH(phAvant: number, phApres: number): 'EFFICACE' | 'INSUFFISANT' {
  return phApres < phAvant ? 'EFFICACE' : 'INSUFFISANT'
}

/**
 * Valide la durée de traitement selon CDC
 * CDC §5.2 Section 6: 3-15 jours
 */
export function validerDureeTraitement(dureeJours: number): {
  valide: boolean
  message: string
} {
  if (dureeJours < 3) {
    return { valide: false, message: 'Durée insuffisante (minimum 3 jours)' }
  }
  if (dureeJours > 15) {
    return { valide: false, message: 'Durée excessive (maximum 15 jours)' }
  }
  return { valide: true, message: 'Durée conforme' }
}

// ============================================
// UTILITAIRES COMMUNS
// ============================================

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formaterNombre(n: number, decimales = 0): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

/**
 * Formate une valeur en litres
 */
export function formaterLitres(litres: number): string {
  if (litres >= 1000) {
    return `${formaterNombre(litres / 1000, 1)} m³`
  }
  return `${formaterNombre(litres)} L`
}

/**
 * Arrondit à l'entier supérieur avec un minimum
 */
export function arrondirMinimum(valeur: number, minimum: number): number {
  return Math.max(Math.ceil(valeur), minimum)
}
