// ============================================
// TYPES PLUG2DRIVE — Identiques à l'original
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
  batimentNom: string
  nbNiveau: string
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
  temperatureExterieure: string
  date: string
  heure: string
}

// --- Rapport Équilibrage ---
export interface RapportEquilibrage {
  id: string
  user_id: string | null

  // Numérotation & références (CDC Phase 1.4)
  numero_dossier: string | null
  reference_devis: string | null
  dossier_pixel: string | null

  // Fiche & Type
  fiche: string | null
  type_installation: string | null
  intitule_cee: string | null  // 'BAR-SE-104' | 'BAT-SE-103'

  // Bénéficiaire
  beneficiaire_nom: string | null
  beneficiaire_adresse: string | null
  beneficiaire_code_postal: string | null
  beneficiaire_ville: string | null
  beneficiaire_telephone: string | null
  beneficiaire_email: string | null
  siren_beneficiaire: string | null

  // Prestataire
  prestataire_nom: string | null
  prestataire_adresse: string | null
  prestataire_code_postal: string | null
  prestataire_ville: string | null
  prestataire_telephone: string | null
  prestataire_email: string | null
  prestataire_logo_url: string | null
  siren_prestataire: string | null

  // Intervenant
  intervenant_nom: string | null
  siret_intervenant: string | null

  // Site
  site_adresse: string | null
  adresse_ligne2: string | null
  site_code_postal: string | null
  site_ville: string | null
  site_ref_cadastrale: string | null
  reference_cadastrale: string | null
  site_nb_batiments: number | null
  site_nb_niveaux: number | null
  site_nb_lots: number | null
  nombre_lots: number | null  // Obligatoire si BAR-SE-104
  surface_chauffee: number | null
  surface_chauffee_m2: number | null  // Obligatoire si BAT-SE-103
  zone_climatique: 'H1' | 'H2' | 'H3' | null
  batiment: string | null
  escalier: string | null
  etage: string | null

  // Contact gardien (CDC)
  gardien_nom: string | null
  gardien_tel: string | null

  // Technicien
  technicien_nom: string | null
  technicien_prenom: string | null
  technicien_date_intervention: string | null

  // Description & Méthodologie
  description_reseau: string | null
  releves_site: string | null
  considerations: string | null
  methode_equilibrage: string | null

  // Installation (conditionnel)
  nom_equipement: string | null
  commentaire_chaufferie: string | null
  photos_chaufferie: string[]
  type_circuit: string | null  // 'bitube' par défaut
  nb_colonnes_total: number | null
  organe_reglage_type: string | null
  commentaire_circulateur: string | null
  photo_circulateur: string | null

  // Température extérieure globale
  temperature_exterieure: string | null

  // Tableaux dynamiques
  tab_mesure_debit: MesureDebit[]
  tab_mesure_temperature: MesureTemperature[]

  // Photos (3 catégories comme l'original)
  photos_site: string[]
  photos_vannes: string[]
  photos_autres: string[]
  // Photos spécifiques CDC
  photo_facade: string | null  // Obligatoire selon CDC
  photos_installation: string[]
  // Legacy columns (backward compat)
  photos_equipement: string[]
  photos_intervention: string[]

  // Signatures
  signature_technicien: string | null
  signature_client: string | null

  // Statut workflow (CDC §10)
  statut: 'brouillon' | 'edite' | 'envoye' | 'facture' | 'paye' | null

  // Métadonnées
  created_at: string
  updated_at: string
}

// --- Rapport Désembouage ---
export interface RapportDesembouage {
  id: string
  user_id: string | null

  // Numérotation & références (CDC Phase 1.5)
  numero_dossier: string | null
  reference_devis: string | null
  dossier_pixel: string | null

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
  reference_cadastrale: string | null
  zone_climatique: 'H1' | 'H2' | 'H3' | null
  batiment: string | null
  escalier: string | null
  etage: string | null

  // Contact gardien (CDC)
  gardien_nom: string | null
  gardien_tel: string | null

  // Technicien
  technicien_nom: string | null
  technicien_prenom: string | null
  technicien_date_intervention: string | null

  // Données techniques
  type_installation: string | null
  type_reseau: string | null
  nature_reseau: 'Acier' | 'Cuivre' | 'Multicouche' | 'Synthétique' | null
  puissance_nominale_kw: number | null
  nb_emetteurs: number | null
  volume_eau_estimatif: number | null
  volume_total_eau: number | null

  // Traitement (CDC §5.2 Section 6)
  quantite_desembouant_l: number | null  // Calculé: volume_m3 × 5
  duree_traitement_jours: number | null  // Validation: 3-15
  date_rincage: string | null
  quantite_inhibiteur_l: number | null

  // Produits (avec valeurs par défaut CDC §5.2 Section 5)
  reac_desembouant_nom: string | null
  reac_desembouant_qte: number | null
  reac_desembouant_duree: string | null
  produit_inhibiteur_nom: string | null
  produit_inhibiteur_qte: number | null
  reactif_desembouant: string | null  // Défaut: 'AQUA-THERM 1200'
  reactif_inhibiteur: string | null   // Défaut: 'AQUA-THERM 1200'
  reference_pompe: string | null      // Défaut: 'POMPE PRISMA 15 3M - ESPA'
  taux_dilution: string | null        // Défaut: '2 l/m³'

  // Analyse eau (CDC §5.2 Section 7)
  ph_avant: number | null
  ph_apres: number | null
  ph_avant_traitement: number | null
  ph_apres_traitement: number | null
  temperature_avant: number | null
  temperature_apres: number | null

  // Photos
  photos_produits: string[]
  photos_vue_aerienne: string[]
  vue_aerienne: string | null  // Photo unique obligatoire
  photos_batiments: string[]
  photos_boues: string[]
  photos_filtre_pot_boues: string[]
  photos_justificatifs: string[]
  photo_chaudiere: string | null

  // Documents annexes (CDC §5.2 Section 9)
  annuaire_coproprietes: string | null  // Fichier PDF
  document_fabricant: string | null     // Fichier PDF obligatoire

  // Signatures
  signature_technicien: string | null
  signature_client: string | null

  // Statut workflow (CDC §10)
  statut: 'brouillon' | 'edite' | 'envoye' | 'facture' | 'paye' | null

  // Métadonnées
  created_at: string
  updated_at: string
}
