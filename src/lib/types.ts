// ============================================
// TYPES PLUG2DRIVE
// ============================================

// --- Utilisateur ---
export interface UserProfile {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  role: 'admin' | 'user' | 'technicien'
  created_at: string
  updated_at: string
}

// --- Mesure Débit (Équilibrage) ---
export interface MesureDebit {
  id: string
  batimentNo: string
  localisation: string
  reperage: string
  reference: string
  marque: string
  dn: string
  debitTheorique: string
  debitMesure: string
  reglage: string
  conformite: 'C' | 'NC' | 'NE'
}

// --- Mesure Température (Équilibrage) ---
export interface MesureTemperature {
  id: string
  batimentNo: string
  batimentNom: string
  niveau: string
  temperatureMesuree: string
}

// --- Rapport Équilibrage ---
export interface RapportEquilibrage {
  id: string
  user_id: string | null

  // Bénéficiaire
  beneficiaire_nom: string | null
  beneficiaire_adresse: string | null
  beneficiaire_code_postal: string | null
  beneficiaire_ville: string | null
  beneficiaire_telephone: string | null
  beneficiaire_email: string | null

  // Prestataire
  prestataire_nom: string | null
  prestataire_adresse: string | null
  prestataire_code_postal: string | null
  prestataire_ville: string | null
  prestataire_telephone: string | null
  prestataire_email: string | null
  prestataire_logo_url: string | null

  // Site
  site_adresse: string | null
  site_code_postal: string | null
  site_ville: string | null
  site_ref_cadastrale: string | null
  site_nb_batiments: number | null
  site_nb_niveaux: number | null
  site_nb_lots: number | null

  // Technicien
  technicien_nom: string | null
  technicien_prenom: string | null
  technicien_date_intervention: string | null

  // Description
  description_reseau: string | null
  methode_equilibrage: string | null

  // Installation (conditionnel)
  commentaire_chaufferie: string | null
  photos_chaufferie: string[]

  // Tableaux dynamiques
  tab_mesure_debit: MesureDebit[]
  tab_mesure_temperature: MesureTemperature[]

  // Photos
  photos_equipement: string[]
  photos_intervention: string[]

  // Signatures
  signature_technicien: string | null
  signature_client: string | null

  // Métadonnées
  created_at: string
  updated_at: string
}

// --- Rapport Désembouage ---
export interface RapportDesembouage {
  id: string
  user_id: string | null

  // Bénéficiaire
  beneficiaire_nom: string | null
  beneficiaire_adresse: string | null
  beneficiaire_code_postal: string | null
  beneficiaire_ville: string | null
  beneficiaire_telephone: string | null
  beneficiaire_email: string | null

  // Prestataire
  prestataire_nom: string | null
  prestataire_adresse: string | null
  prestataire_code_postal: string | null
  prestataire_ville: string | null
  prestataire_telephone: string | null
  prestataire_email: string | null
  prestataire_logo_url: string | null

  // Site
  site_adresse: string | null
  site_code_postal: string | null
  site_ville: string | null
  site_nb_batiments: number | null
  site_nb_appartements: number | null

  // Technicien
  technicien_nom: string | null
  technicien_prenom: string | null
  technicien_date_intervention: string | null

  // Données techniques
  type_installation: string | null
  type_reseau: string | null
  nb_emetteurs: number | null
  volume_eau_estimatif: number | null
  volume_total_eau: number | null

  // Produits
  reac_desembouant_nom: string | null
  reac_desembouant_qte: number | null
  reac_desembouant_duree: string | null
  produit_inhibiteur_nom: string | null
  produit_inhibiteur_qte: number | null

  // Résultats
  ph_avant: number | null
  ph_apres: number | null
  temperature_avant: number | null
  temperature_apres: number | null

  // Photos
  photos_produits: string[]
  photos_vue_aerienne: string[]
  photos_batiments: string[]
  photos_boues: string[]
  photos_justificatifs: string[]

  // Signatures
  signature_technicien: string | null
  signature_client: string | null

  // Métadonnées
  created_at: string
  updated_at: string
}
