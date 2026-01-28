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
  role: z.enum(['admin', 'user', 'technicien']),
})

export type UserCreateFormData = z.infer<typeof userCreateSchema>

// --- Mesure Débit ---
export const mesureDebitSchema = z.object({
  id: z.string(),
  batimentNo: z.string(),
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

// --- Mesure Température ---
export const mesureTemperatureSchema = z.object({
  id: z.string(),
  batimentNo: z.string(),
  batimentNom: z.string(),
  niveau: z.string(),
  temperatureMesuree: z.string(),
})

// --- Rapport Équilibrage ---
// All number fields are stored as strings in the form and converted on submit
export const equilibrageSchema = z.object({
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
  site_ref_cadastrale: z.string().optional(),
  site_nb_batiments: z.string().optional(),
  site_nb_niveaux: z.string().optional(),
  site_nb_lots: z.string().optional(),

  // Technicien
  technicien_nom: z.string().optional(),
  technicien_prenom: z.string().optional(),
  technicien_date_intervention: z.string().optional(),

  // Description
  description_reseau: z.string().optional(),
  methode_equilibrage: z.string().optional(),

  // Installation
  commentaire_chaufferie: z.string().optional(),

  // Tableaux dynamiques
  tab_mesure_debit: z.array(mesureDebitSchema).optional(),
  tab_mesure_temperature: z.array(mesureTemperatureSchema).optional(),
})

export type EquilibrageFormData = z.infer<typeof equilibrageSchema>

// --- Rapport Désembouage ---
export const desembouageSchema = z.object({
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

  // Technicien
  technicien_nom: z.string().optional(),
  technicien_prenom: z.string().optional(),
  technicien_date_intervention: z.string().optional(),

  // Données techniques
  type_installation: z.string().optional(),
  type_reseau: z.string().optional(),

  // Produits
  reac_desembouant_nom: z.string().optional(),
  reac_desembouant_qte: z.string().optional(),
  reac_desembouant_duree: z.string().optional(),
  produit_inhibiteur_nom: z.string().optional(),
  produit_inhibiteur_qte: z.string().optional(),

  // Résultats
  ph_avant: z.string().optional(),
  ph_apres: z.string().optional(),
  temperature_avant: z.string().optional(),
  temperature_apres: z.string().optional(),
})

export type DesembouageFormData = z.infer<typeof desembouageSchema>

// --- Helper: Convert string form data to numbers for DB ---
export function toNumber(val: string | undefined): number | null {
  if (!val || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}
