'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { desembouageSchema, type DesembouageFormData, toNumber } from '@/lib/validations'
import { calculerNbEmetteurs, calculerVolumeEstimatif, calculerVolumeTotal } from '@/lib/formulas'
import type { RapportDesembouage } from '@/lib/types'
import { PRODUITS_DEFAUT, NATURES_RESEAU, ZONES_CLIMATIQUES, TYPES_INSTALLATION } from '@/lib/constants/plug2drive'
import PhotoUpload from './PhotoUpload'
import SignatureField from './SignatureField'
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface DesembouageFormProps {
  rapport?: RapportDesembouage
  mode: 'create' | 'edit'
}

export default function DesembouageForm({ rapport, mode }: DesembouageFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photos state
  const [photosProduits, setPhotosProduits] = useState<string[]>(rapport?.photos_produits || [])
  const [photosVueAerienne, setPhotosVueAerienne] = useState<string[]>(rapport?.photos_vue_aerienne || [])
  const [photosBatiments, setPhotosBatiments] = useState<string[]>(rapport?.photos_batiments || [])
  const [photosBoues, setPhotosBoues] = useState<string[]>(rapport?.photos_boues || [])
  const [photosFiltrePotBoues, setPhotosFiltrePotBoues] = useState<string[]>(rapport?.photos_filtre_pot_boues || [])
  const [photosJustificatifs, setPhotosJustificatifs] = useState<string[]>(rapport?.photos_justificatifs || [])
  const [vueAerienne, setVueAerienne] = useState<string | null>(rapport?.vue_aerienne || null)
  const [photoChaudiere, setPhotoChaudiere] = useState<string | null>(rapport?.photo_chaudiere || null)
  const [signatureTech, setSignatureTech] = useState<string | null>(rapport?.signature_technicien || null)
  const [signatureClient, setSignatureClient] = useState<string | null>(rapport?.signature_client || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(rapport?.prestataire_logo_url || null)

  // Auto-calculated values
  const [nbEmetteurs, setNbEmetteurs] = useState<number>(rapport?.nb_emetteurs || 0)
  const [volumeEstimatif, setVolumeEstimatif] = useState<number>(rapport?.volume_eau_estimatif || 0)
  const [volumeTotal, setVolumeTotal] = useState<number>(rapport?.volume_total_eau || 0)

  const { register, handleSubmit, control, formState: { errors } } = useForm<DesembouageFormData>({
    resolver: zodResolver(desembouageSchema),
    defaultValues: {
      // Numérotation & références (CDC)
      numero_dossier: rapport?.numero_dossier || '',
      reference_devis: rapport?.reference_devis || '',
      dossier_pixel: rapport?.dossier_pixel || '',
      // Bénéficiaire
      beneficiaire_nom: rapport?.beneficiaire_nom || '',
      beneficiaire_adresse: rapport?.beneficiaire_adresse || '',
      beneficiaire_code_postal: rapport?.beneficiaire_code_postal || '',
      beneficiaire_ville: rapport?.beneficiaire_ville || '',
      beneficiaire_telephone: rapport?.beneficiaire_telephone || '',
      beneficiaire_email: rapport?.beneficiaire_email || '',
      // Prestataire
      prestataire_nom: rapport?.prestataire_nom || '',
      prestataire_adresse: rapport?.prestataire_adresse || '',
      prestataire_code_postal: rapport?.prestataire_code_postal || '',
      prestataire_ville: rapport?.prestataire_ville || '',
      prestataire_telephone: rapport?.prestataire_telephone || '',
      prestataire_email: rapport?.prestataire_email || '',
      // Site
      site_adresse: rapport?.site_adresse || '',
      site_code_postal: rapport?.site_code_postal || '',
      site_ville: rapport?.site_ville || '',
      site_nb_batiments: rapport?.site_nb_batiments != null ? String(rapport.site_nb_batiments) : '',
      site_nb_appartements: rapport?.site_nb_appartements != null ? String(rapport.site_nb_appartements) : '',
      reference_cadastrale: rapport?.reference_cadastrale || '',
      zone_climatique: rapport?.zone_climatique || undefined,
      batiment: rapport?.batiment || '',
      escalier: rapport?.escalier || '',
      etage: rapport?.etage || '',
      // Gardien (CDC)
      gardien_nom: rapport?.gardien_nom || '',
      gardien_tel: rapport?.gardien_tel || '',
      // Technicien
      technicien_nom: rapport?.technicien_nom || '',
      technicien_prenom: rapport?.technicien_prenom || '',
      technicien_date_intervention: rapport?.technicien_date_intervention || '',
      // Données techniques
      type_installation: rapport?.type_installation || '',
      type_reseau: rapport?.type_reseau || '',
      nature_reseau: rapport?.nature_reseau || undefined,
      puissance_nominale_kw: rapport?.puissance_nominale_kw != null ? String(rapport.puissance_nominale_kw) : '',
      // Traitement (CDC §5.2 Section 6)
      quantite_desembouant_l: rapport?.quantite_desembouant_l != null ? String(rapport.quantite_desembouant_l) : '',
      duree_traitement_jours: rapport?.duree_traitement_jours != null ? String(rapport.duree_traitement_jours) : '',
      date_rincage: rapport?.date_rincage || '',
      quantite_inhibiteur_l: rapport?.quantite_inhibiteur_l != null ? String(rapport.quantite_inhibiteur_l) : '',
      // Produits (avec valeurs par défaut CDC)
      reac_desembouant_nom: rapport?.reac_desembouant_nom || '',
      reac_desembouant_qte: rapport?.reac_desembouant_qte != null ? String(rapport.reac_desembouant_qte) : '',
      reac_desembouant_duree: rapport?.reac_desembouant_duree || '',
      produit_inhibiteur_nom: rapport?.produit_inhibiteur_nom || '',
      produit_inhibiteur_qte: rapport?.produit_inhibiteur_qte != null ? String(rapport.produit_inhibiteur_qte) : '',
      reactif_desembouant: rapport?.reactif_desembouant || PRODUITS_DEFAUT.reactif_desembouant,
      reactif_inhibiteur: rapport?.reactif_inhibiteur || PRODUITS_DEFAUT.reactif_inhibiteur,
      reference_pompe: rapport?.reference_pompe || PRODUITS_DEFAUT.reference_pompe,
      taux_dilution: rapport?.taux_dilution || PRODUITS_DEFAUT.taux_dilution,
      // Analyse eau (CDC §5.2 Section 7)
      ph_avant: rapport?.ph_avant != null ? String(rapport.ph_avant) : '',
      ph_apres: rapport?.ph_apres != null ? String(rapport.ph_apres) : '',
      ph_avant_traitement: rapport?.ph_avant_traitement != null ? String(rapport.ph_avant_traitement) : '',
      ph_apres_traitement: rapport?.ph_apres_traitement != null ? String(rapport.ph_apres_traitement) : '',
      temperature_avant: rapport?.temperature_avant != null ? String(rapport.temperature_avant) : '',
      temperature_apres: rapport?.temperature_apres != null ? String(rapport.temperature_apres) : '',
      // Statut
      statut: rapport?.statut || 'brouillon',
    },
  })

  // Watch nb_appartements for auto-calculation
  const nbAppartements = useWatch({ control, name: 'site_nb_appartements' })

  useEffect(() => {
    const nbAppartementsNum = nbAppartements ? Number(nbAppartements) : 0
    if (nbAppartementsNum > 0) {
      const emetteurs = calculerNbEmetteurs(nbAppartementsNum)
      const estimatif = calculerVolumeEstimatif(nbAppartementsNum)
      const total = calculerVolumeTotal(estimatif)
      setNbEmetteurs(emetteurs)
      setVolumeEstimatif(estimatif)
      setVolumeTotal(total)
    } else {
      setNbEmetteurs(0)
      setVolumeEstimatif(0)
      setVolumeTotal(0)
    }
  }, [nbAppartements])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'logos')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) setLogoUrl(data.url)
    } catch (err) {
      console.error('Logo upload error:', err)
    }
  }

  const onSubmit = async (data: DesembouageFormData) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
        // Conversions numériques
        site_nb_batiments: toNumber(data.site_nb_batiments),
        site_nb_appartements: toNumber(data.site_nb_appartements),
        puissance_nominale_kw: toNumber(data.puissance_nominale_kw),
        quantite_desembouant_l: toNumber(data.quantite_desembouant_l),
        duree_traitement_jours: toNumber(data.duree_traitement_jours),
        quantite_inhibiteur_l: toNumber(data.quantite_inhibiteur_l),
        reac_desembouant_qte: toNumber(data.reac_desembouant_qte),
        produit_inhibiteur_qte: toNumber(data.produit_inhibiteur_qte),
        ph_avant: toNumber(data.ph_avant),
        ph_apres: toNumber(data.ph_apres),
        ph_avant_traitement: toNumber(data.ph_avant_traitement),
        ph_apres_traitement: toNumber(data.ph_apres_traitement),
        temperature_avant: toNumber(data.temperature_avant),
        temperature_apres: toNumber(data.temperature_apres),
        // Logo et valeurs calculées
        prestataire_logo_url: logoUrl,
        nb_emetteurs: nbEmetteurs,
        volume_eau_estimatif: volumeEstimatif,
        volume_total_eau: volumeTotal,
        // Photos
        photos_produits: photosProduits,
        photos_vue_aerienne: photosVueAerienne,
        photos_batiments: photosBatiments,
        photos_boues: photosBoues,
        photos_filtre_pot_boues: photosFiltrePotBoues,
        photos_justificatifs: photosJustificatifs,
        vue_aerienne: vueAerienne,
        photo_chaudiere: photoChaudiere,
        // Signatures
        signature_technicien: signatureTech,
        signature_client: signatureClient,
        ...(mode === 'edit' ? { id: rapport!.id } : {}),
      }

      const res = await fetch('/api/rapports/desembouage', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la sauvegarde')

      router.push('/dashboard/desembouage-list')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/desembouage-list" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Nouveau rapport de désembouage' : 'Modifier le rapport'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Section 0 : Numérotation & Références */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Références Dossier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">N° Dossier</label>
              <input {...register('numero_dossier')} className={inputClass} placeholder="PLUG-2026-000001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Référence devis</label>
              <input {...register('reference_devis')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Dossier Pixel</label>
              <input {...register('dossier_pixel')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Bénéficiaire */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg">Bénéficiaire</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom / Raison sociale</label>
              <input {...register('beneficiaire_nom')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input {...register('beneficiaire_email')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Adresse</label>
              <input {...register('beneficiaire_adresse')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Code postal</label>
              <input {...register('beneficiaire_code_postal')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ville</label>
              <input {...register('beneficiaire_ville')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Téléphone</label>
              <input {...register('beneficiaire_telephone')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Prestataire */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg">Prestataire</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom / Raison sociale</label>
              <input {...register('prestataire_nom')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input {...register('prestataire_email')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Adresse</label>
              <input {...register('prestataire_adresse')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Code postal</label>
              <input {...register('prestataire_code_postal')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ville</label>
              <input {...register('prestataire_ville')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Téléphone</label>
              <input {...register('prestataire_telephone')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Logo</label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Site d'intervention */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Site d&apos;intervention</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Adresse</label>
              <input {...register('site_adresse')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Code postal</label>
              <input {...register('site_code_postal')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ville</label>
              <input {...register('site_ville')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Référence cadastrale</label>
              <input {...register('reference_cadastrale')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone climatique</label>
              <select {...register('zone_climatique')} className={inputClass}>
                <option value="">Sélectionner...</option>
                {ZONES_CLIMATIQUES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre de bâtiments</label>
              <input type="number" {...register('site_nb_batiments')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre d&apos;appartements</label>
              <input type="number" {...register('site_nb_appartements')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bâtiment</label>
              <input {...register('batiment')} className={inputClass} placeholder="A, B, C..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Escalier</label>
              <input {...register('escalier')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Étage</label>
              <input {...register('etage')} className={inputClass} />
            </div>
          </div>

          {/* Contact Gardien */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Gardien</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom du gardien</label>
                <input {...register('gardien_nom')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Téléphone gardien</label>
                <input {...register('gardien_tel')} className={inputClass} placeholder="06 00 00 00 00" />
              </div>
            </div>
          </div>
        </div>

        {/* Technicien */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg">Technicien</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input {...register('technicien_nom')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Prénom</label>
              <input {...register('technicien_prenom')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date d&apos;intervention</label>
              <input type="date" {...register('technicien_date_intervention')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Données Techniques */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Données techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type d&apos;installation</label>
              <select {...register('type_installation')} className={inputClass}>
                <option value="">Sélectionner...</option>
                {TYPES_INSTALLATION.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type de réseau</label>
              <input {...register('type_reseau')} className={inputClass} placeholder="Bitube, monotube..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nature du réseau</label>
              <select {...register('nature_reseau')} className={inputClass}>
                <option value="">Sélectionner...</option>
                {NATURES_RESEAU.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Puissance nominale (kW)</label>
              <input type="number" {...register('puissance_nominale_kw')} className={inputClass} />
            </div>
          </div>

          {/* Auto-calculated fields */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
            <h4 className="font-semibold text-blue-800">Valeurs calculées automatiquement</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-blue-700">
                  Nombre d&apos;émetteurs
                </label>
                <input
                  value={nbEmetteurs}
                  readOnly
                  className={`${inputClass} bg-blue-100/50 cursor-not-allowed`}
                />
                <p className="text-xs text-blue-600 mt-1">= nb appartements × 4</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-blue-700">
                  Volume eau estimatif (L)
                </label>
                <input
                  value={volumeEstimatif}
                  readOnly
                  className={`${inputClass} bg-blue-100/50 cursor-not-allowed`}
                />
                <p className="text-xs text-blue-600 mt-1">= nb appartements × 80</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-blue-700">
                  Volume total eau circuit (L)
                </label>
                <input
                  value={volumeTotal}
                  readOnly
                  className={`${inputClass} bg-blue-100/50 cursor-not-allowed`}
                />
                <p className="text-xs text-blue-600 mt-1">= volume estimatif × 0.87</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Traitement (CDC §5.2 Section 6) */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Traitement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité désembouant (L)</label>
              <input type="number" {...register('quantite_desembouant_l')} className={inputClass} />
              <p className="text-xs text-muted-foreground mt-1">Calcul recommandé : volume_m³ × 5</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Durée traitement (jours)</label>
              <input type="number" min="3" max="15" {...register('duree_traitement_jours')} className={inputClass} />
              <p className="text-xs text-muted-foreground mt-1">Entre 3 et 15 jours selon CDC</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date de rinçage</label>
              <input type="date" {...register('date_rincage')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité inhibiteur (L)</label>
              <input type="number" {...register('quantite_inhibiteur_l')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Produits (CDC §5.2 Section 5) */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Produits utilisés</h3>

          {/* Produits par défaut CDC */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-300">Produits standard (valeurs par défaut CDC)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Réactif désembouant</label>
                <input {...register('reactif_desembouant')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Réactif inhibiteur</label>
                <input {...register('reactif_inhibiteur')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Référence pompe</label>
                <input {...register('reference_pompe')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Taux de dilution</label>
                <input {...register('taux_dilution')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Produits détaillés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom réactif désembouant</label>
              <input {...register('reac_desembouant_nom')} className={inputClass} placeholder="Nom commercial" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité (L)</label>
              <input type="number" step="0.1" {...register('reac_desembouant_qte')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Durée d&apos;action</label>
              <input {...register('reac_desembouant_duree')} className={inputClass} placeholder="Ex: 48h" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Inhibiteur de corrosion</label>
              <input {...register('produit_inhibiteur_nom')} className={inputClass} placeholder="Nom commercial" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité (L)</label>
              <input type="number" step="0.1" {...register('produit_inhibiteur_qte')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Analyse eau (CDC §5.2 Section 7) */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Analyse de l&apos;eau</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase">Avant traitement</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">pH avant</label>
                  <input type="number" step="0.1" {...register('ph_avant_traitement')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Température (°C)</label>
                  <input type="number" step="0.1" {...register('temperature_avant')} className={inputClass} />
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-4">
              <h4 className="font-medium text-sm text-green-700 dark:text-green-400 uppercase">Après traitement</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">pH après</label>
                  <input type="number" step="0.1" {...register('ph_apres_traitement')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Température (°C)</label>
                  <input type="number" step="0.1" {...register('temperature_apres')} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Note CDC : Le pH après traitement doit être inférieur au pH avant traitement pour valider l&apos;efficacité du désembouage.
          </p>
        </div>

        {/* Photos */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Photos</h3>

          {/* Vue aérienne - Obligatoire CDC */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <label className="block text-sm font-medium mb-2">
              Vue aérienne <span className="text-destructive">* (obligatoire)</span>
            </label>
            <div className="flex items-start gap-4">
              {vueAerienne ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vueAerienne} alt="Vue aérienne" className="w-48 h-36 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setVueAerienne(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-36 border-2 border-dashed border-amber-400 rounded-lg flex items-center justify-center text-amber-600 text-sm">
                  Aucune photo
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('folder', 'desembouage/vue-aerienne')
                    const res = await fetch('/api/upload', { method: 'POST', body: formData })
                    const data = await res.json()
                    if (data.url) setVueAerienne(data.url)
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Photo satellite/aérienne du site - requise pour la conformité CEE
                </p>
              </div>
            </div>
          </div>

          {/* Photo chaudière */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Photo chaudière</label>
            <div className="flex items-start gap-4">
              {photoChaudiere ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoChaudiere} alt="Chaudière" className="w-32 h-32 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setPhotoChaudiere(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('folder', 'desembouage/chaudiere')
                  const res = await fetch('/api/upload', { method: 'POST', body: formData })
                  const data = await res.json()
                  if (data.url) setPhotoChaudiere(data.url)
                }}
                className="text-sm"
              />
            </div>
          </div>

          <PhotoUpload photos={photosProduits} onChange={setPhotosProduits} label="Photos produits" />
          <PhotoUpload photos={photosVueAerienne} onChange={setPhotosVueAerienne} label="Photos vue aérienne (supplémentaires)" />
          <PhotoUpload photos={photosBatiments} onChange={setPhotosBatiments} label="Photos bâtiments" />
          <PhotoUpload photos={photosBoues} onChange={setPhotosBoues} label="Photos boues" />
          <PhotoUpload photos={photosFiltrePotBoues} onChange={setPhotosFiltrePotBoues} label="Photos filtre / pot à boues" />
          <PhotoUpload photos={photosJustificatifs} onChange={setPhotosJustificatifs} label="Pièces justificatives" />
        </div>

        {/* Signatures */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg">Signatures</h3>
          <SignatureField label="Signature du technicien" value={signatureTech} onChange={setSignatureTech} />
          <SignatureField label="Signature du client" value={signatureClient} onChange={setSignatureClient} />
        </div>

        {/* Error & Actions */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="flex items-center justify-end pt-4 pb-8">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Créer le rapport' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
