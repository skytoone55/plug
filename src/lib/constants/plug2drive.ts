/**
 * Constantes système PLUG2DRIVE
 * Source: Cahier des charges §1.3
 */

// === INFORMATIONS ENTREPRISE ===
export const PLUG2DRIVE = {
  nom: 'PLUG 2 DRIVE',
  siret: '91772738000011',
  siren: '917 727 380',
  adresse: "74 rue jouffroy d'Abbans",
  code_postal: '75017',
  ville: 'Paris',
  email: 'i.ohayon@plug2drive.net',
  certification: 'Qualisav - Synasav',
  telephone: '', // À compléter si nécessaire
} as const

// === PRODUITS PAR DÉFAUT (CDC §5.2 Section 5) ===
export const PRODUITS_DEFAUT = {
  reactif_desembouant: 'AQUA-THERM 1200',
  reactif_inhibiteur: 'AQUA-THERM 1200',
  reference_pompe: 'POMPE PRISMA 15 3M - ESPA',
  taux_dilution: '2 l/m³',
} as const

// === FICHES CEE (CDC §9.3) ===
export const FICHES_CEE = {
  DESEMBOUAGE: 'BAR-SE-109',
  EQUILIBRAGE_RESIDENTIEL: 'BAR-SE-104',
  EQUILIBRAGE_TERTIAIRE: 'BAT-SE-103',
} as const

// === TYPES D'INSTALLATION CHAUFFAGE (CDC §9.1) ===
export const TYPES_INSTALLATION = [
  'Chaudière condensation',
  'Chaudière hors condensation',
  'Réseau de chaleur',
] as const

// === NATURES DE RÉSEAU (CDC §9.2) ===
export const NATURES_RESEAU = [
  'Acier',
  'Cuivre',
  'Multicouche',
  'Synthétique',
] as const

// === LOCALISATIONS VANNES (CDC §9.4) ===
export const LOCALISATIONS_VANNES = [
  'CHAUFFERIE',
  'SOUS-STATION',
  'PARKING',
  'CAVE',
  'RDC',
  'PALIER',
  'GAINE TECHNIQUE',
] as const

// === RÉFÉRENCES VANNES (CDC §9.5) ===
export const REFERENCES_VANNES = [
  { reference: 'STAD', marque: 'IMI' },
  { reference: 'HYDROCONTROL VTR', marque: 'OVENTROP' },
] as const

// === DIAMÈTRES NOMINAUX DN (CDC §9.6) ===
export const DIAMETRES_NOMINAUX = [
  '15', '20', '25', '32', '40', '50', '65', '80', '100',
] as const

// === LOCALISATIONS TEMPÉRATURE (CDC §9.7) ===
export const LOCALISATIONS_TEMPERATURE = [
  'RDC',
  '1er étage',
  '2eme étage',
  '3eme étage',
  '4eme étage',
  '5eme étage',
  '6eme étage',
  '7eme étage',
  '8eme étage',
  '9eme étage',
  '10eme étage',
] as const

// === CODES CONFORMITÉ (CDC §9.8) ===
export const CONFORMITES = {
  C: 'Conforme',
  NC: 'Non Conforme',
  NE: 'Non exécuté',
} as const

// === STATUTS INTERVENTION (CDC §9.9) ===
export const STATUTS_INTERVENTION = {
  brouillon: 'En cours de saisie',
  edite: 'Rapport généré',
  envoye: 'Rapport transmis au client',
  facture: 'Facture émise',
  paye: 'Paiement reçu',
} as const

// === TYPES CLIENT FINAL (CDC §9.10) ===
export const TYPES_CLIENT_FINAL = [
  'Syndic',
  'Bailleur social',
  'Tertiaire',
] as const

// === ZONES CLIMATIQUES (CDC §9.11) ===
export const ZONES_CLIMATIQUES = ['H1', 'H2', 'H3'] as const

// === TYPES POUR TYPESCRIPT ===
export type TypeInstallation = (typeof TYPES_INSTALLATION)[number]
export type NatureReseau = (typeof NATURES_RESEAU)[number]
export type LocalisationVanne = (typeof LOCALISATIONS_VANNES)[number]
export type DiametreNominal = (typeof DIAMETRES_NOMINAUX)[number]
export type LocalisationTemperature = (typeof LOCALISATIONS_TEMPERATURE)[number]
export type CodeConformite = keyof typeof CONFORMITES
export type StatutIntervention = keyof typeof STATUTS_INTERVENTION
export type TypeClientFinal = (typeof TYPES_CLIENT_FINAL)[number]
export type ZoneClimatique = (typeof ZONES_CLIMATIQUES)[number]
export type FicheCEE = (typeof FICHES_CEE)[keyof typeof FICHES_CEE]
