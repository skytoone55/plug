// ============================================
// FORMULES AUTOMATIQUES PLUG2DRIVE
// ============================================

/**
 * Calcul du nombre d'émetteurs
 * Formule exacte : nb_appartements × 4
 */
export function calculerNbEmetteurs(nbAppartements: number): number {
  return nbAppartements * 4
}

/**
 * Calcul du volume d'eau estimatif
 * Formule exacte : nb_appartements × 80 (en litres)
 */
export function calculerVolumeEstimatif(nbAppartements: number): number {
  return nbAppartements * 80
}

/**
 * Calcul du volume total d'eau du circuit
 * Formule exacte : volume_estimatif × 0.86975
 */
export function calculerVolumeTotal(volumeEstimatif: number): number {
  return Math.round(volumeEstimatif * 0.86975)
}

/**
 * Calcul de l'écart de température
 * Formule : température actuelle - température précédente (même bâtiment)
 * Retourne null si c'est la première mesure du bâtiment
 */
export function calculerEcartTemperature(
  temperatureActuelle: number,
  temperaturePrecedente: number | null
): number | null {
  if (temperaturePrecedente === null) return null
  return Number((temperatureActuelle - temperaturePrecedente).toFixed(1))
}
