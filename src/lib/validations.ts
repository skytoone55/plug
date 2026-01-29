import { z } from 'zod'

// --- Login ---
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// --- Utilisateur ---
export const userCreateSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  role: z.enum(['admin', 'installateur', 'technicien']),
})

export type UserCreateFormData = z.infer<typeof userCreateSchema>

// --- Mesure Débit (avec champs identiques à l'original) ---
export const mesureDebitSchema = z.object({
  id: z.string(),
  batimentNo: z.string(),
  batimentNom: z.string(),
  nbNiveau: z.string(),
  localisation: z.string(),
  reperage: z.string(),
  reference: z.string(),
  marque: z.string(),
  dn: z.string(),
  debitTheorique: z.string(),
  debitMesure: z.string(),
  reglage: z.string(),
  conformite: z.enum(['C', 'NC', 'NE']),
})

// --- Mesure Température (avec champs identiques à l'original) ---
export const mesureTemperatureSchema = z.object({
  id: z.string(),
  batimentNo: z.string(),
  batimentNom: z.string(),
  niveau: z.string(),
  temperatureMesuree: z.string(),
  temperatureExterieure: z.string(),
  date: z.string(),
  heure: z.string(),
})

// --- Rapport Équilibrage (tous les champs CDC) ---
export const equilibrageSchema = z.object({
  // Numérotation & références (CDC Phase 1.4)
  numero_dossier: z.string().optional(),
  reference_devis: z.string().optional(),
  dossier_pixel: z.string().optional(),

  // Fiche & Type
  fiche: z.string().optional(),
  type_installation: z.string().optional(),
  intitule_cee: z.enum(['BAR-SE-104', 'BAT-SE-103']).optional(),

  // Bénéficiaire
  beneficiaire_nom: z.string().optional(),
  beneficiaire_adresse: z.string().optional(),
  beneficiaire_code_postal: z.string().optional(),
  beneficiaire_ville: z.string().optional(),
  beneficiaire_telephone: z.string().optional(),
  beneficiaire_email: z.string().optional(),
  siren_beneficiaire: z.string().optional(),

  // Prestataire
  prestataire_nom: z.string().optional(),
  prestataire_adresse: z.string().optional(),
  prestataire_code_postal: z.string().optional(),
  prestataire_ville: z.string().optional(),
  prestataire_telephone: z.string().optional(),
  prestataire_email: z.string().optional(),
  siren_prestataire: z.string().optional(),

  // Intervenant
  intervenant_nom: z.string().optional(),
  siret_intervenant: z.string().optional(),

  // Site
  site_adresse: z.string().optional(),
  adresse_ligne2: z.string().optional(),
  site_code_postal: z.string().optional(),
  site_ville: z.string().optional(),
  site_ref_cadastrale: z.string().optional(),
  reference_cadastrale: z.string().optional(),
  site_nb_batiments: z.string().optional(),
  site_nb_niveaux: z.string().optional(),
  site_nb_lots: z.string().optional(),
  nombre_lots: z.string().optional(),  // Obligatoire si BAR-SE-104
  surface_chauffee: z.string().optional(),
  surface_chauffee_m2: z.string().optional(),  // Obligatoire si BAT-SE-103
  zone_climatique: z.enum(['H1', 'H2', 'H3']).optional(),
  batiment: z.string().optional(),
  escalier: z.string().optional(),
  etage: z.string().optional(),

  // Contact gardien (CDC)
  gardien_nom: z.string().optional(),
  gardien_tel: z.string().optional(),

  // Technicien
  technicien_nom: z.string().optional(),
  technicien_prenom: z.string().optional(),
  technicien_date_intervention: z.string().optional(),

  // Description & Méthodologie
  description_reseau: z.string().optional(),
  releves_site: z.string().optional(),
  considerations: z.string().optional(),
  methode_equilibrage: z.string().optional(),

  // Installation
  nom_equipement: z.string().optional(),
  commentaire_chaufferie: z.string().optional(),
  type_circuit: z.string().optional(),
  nb_colonnes_total: z.string().optional(),
  organe_reglage_type: z.string().optional(),
  commentaire_circulateur: z.string().optional(),

  // Température extérieure globale
  temperature_exterieure: z.string().optional(),

  // Tableaux dynamiques
  tab_mesure_debit: z.array(mesureDebitSchema).optional(),
  tab_mesure_temperature: z.array(mesureTemperatureSchema).optional(),

  // Statut workflow
  statut: z.enum(['brouillon', 'edite', 'envoye', 'facture', 'paye']).optional(),
})

export type EquilibrageFormData = z.infer<typeof equilibrageSchema>

// --- Rapport Désembouage (tous les champs CDC) ---
export const desembouageSchema = z.object({
  // Numérotation & références (CDC Phase 1.5)
  numero_dossier: z.string().optional(),
  reference_devis: z.string().optional(),
  dossier_pixel: z.string().optional(),

  // Bénéficiaire
  beneficiaire_nom: z.string().optional(),
  beneficiaire_adresse: z.string().optional(),
  beneficiaire_code_postal: z.string().optional(),
  beneficiaire_ville: z.string().optional(),
  beneficiaire_telephone: z.string().optional(),
  beneficiaire_email: z.string().optional(),

  // Prestataire
  prestataire_nom: z.string().optional(),
  prestataire_adresse: z.string().optional(),
  prestataire_code_postal: z.string().optional(),
  prestataire_ville: z.string().optional(),
  prestataire_telephone: z.string().optional(),
  prestataire_email: z.string().optional(),

  // Site
  site_adresse: z.string().optional(),
  site_code_postal: z.string().optional(),
  site_ville: z.string().optional(),
  site_nb_batiments: z.string().optional(),
  site_nb_appartements: z.string().optional(),
  reference_cadastrale: z.string().optional(),
  zone_climatique: z.enum(['H1', 'H2', 'H3']).optional(),
  batiment: z.string().optional(),
  escalier: z.string().optional(),
  etage: z.string().optional(),

  // Contact gardien (CDC)
  gardien_nom: z.string().optional(),
  gardien_tel: z.string().optional(),

  // Technicien
  technicien_nom: z.string().optional(),
  technicien_prenom: z.string().optional(),
  technicien_date_intervention: z.string().optional(),

  // Données techniques
  type_installation: z.string().optional(),
  type_reseau: z.string().optional(),
  nature_reseau: z.enum(['Acier', 'Cuivre', 'Multicouche', 'Synthétique']).optional(),
  puissance_nominale_kw: z.string().optional(),

  // Traitement (CDC §5.2 Section 6)
  quantite_desembouant_l: z.string().optional(),
  duree_traitement_jours: z.string().optional(),
  date_rincage: z.string().optional(),
  quantite_inhibiteur_l: z.string().optional(),

  // Produits (avec valeurs par défaut CDC §5.2 Section 5)
  reac_desembouant_nom: z.string().optional(),
  reac_desembouant_qte: z.string().optional(),
  reac_desembouant_duree: z.string().optional(),
  produit_inhibiteur_nom: z.string().optional(),
  produit_inhibiteur_qte: z.string().optional(),
  reactif_desembouant: z.string().optional(),
  reactif_inhibiteur: z.string().optional(),
  reference_pompe: z.string().optional(),
  taux_dilution: z.string().optional(),

  // Analyse eau (CDC §5.2 Section 7)
  ph_avant: z.string().optional(),
  ph_apres: z.string().optional(),
  ph_avant_traitement: z.string().optional(),
  ph_apres_traitement: z.string().optional(),
  temperature_avant: z.string().optional(),
  temperature_apres: z.string().optional(),

  // Statut workflow
  statut: z.enum(['brouillon', 'edite', 'envoye', 'facture', 'paye']).optional(),
})

export type DesembouageFormData = z.infer<typeof desembouageSchema>

// --- Helper: Convert string form data to numbers for DB ---
export function toNumber(val: string | undefined): number | null {
  if (!val || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}
