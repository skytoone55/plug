'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { desembouageSchema, type DesembouageFormData, toNumber } from '@/lib/validations'
import { calculerNbEmetteurs, calculerVolumeEstimatif, calculerVolumeTotal } from '@/lib/formulas'
import type { RapportDesembouage } from '@/lib/types'
import PhotoUpload from './PhotoUpload'
import SignatureField from './SignatureField'
import { Loader2, ArrowLeft } from 'lucide-react'
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
  const [photosJustificatifs, setPhotosJustificatifs] = useState<string[]>(rapport?.photos_justificatifs || [])
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
      beneficiaire_nom: rapport?.beneficiaire_nom || '',
      beneficiaire_adresse: rapport?.beneficiaire_adresse || '',
      beneficiaire_code_postal: rapport?.beneficiaire_code_postal || '',
      beneficiaire_ville: rapport?.beneficiaire_ville || '',
      beneficiaire_telephone: rapport?.beneficiaire_telephone || '',
      beneficiaire_email: rapport?.beneficiaire_email || '',
      prestataire_nom: rapport?.prestataire_nom || '',
      prestataire_adresse: rapport?.prestataire_adresse || '',
      prestataire_code_postal: rapport?.prestataire_code_postal || '',
      prestataire_ville: rapport?.prestataire_ville || '',
      prestataire_telephone: rapport?.prestataire_telephone || '',
      prestataire_email: rapport?.prestataire_email || '',
      site_adresse: rapport?.site_adresse || '',
      site_code_postal: rapport?.site_code_postal || '',
      site_ville: rapport?.site_ville || '',
      site_nb_batiments: rapport?.site_nb_batiments != null ? String(rapport.site_nb_batiments) : '',
      site_nb_appartements: rapport?.site_nb_appartements != null ? String(rapport.site_nb_appartements) : '',
      technicien_nom: rapport?.technicien_nom || '',
      technicien_prenom: rapport?.technicien_prenom || '',
      technicien_date_intervention: rapport?.technicien_date_intervention || '',
      type_installation: rapport?.type_installation || '',
      type_reseau: rapport?.type_reseau || '',
      reac_desembouant_nom: rapport?.reac_desembouant_nom || '',
      reac_desembouant_qte: rapport?.reac_desembouant_qte != null ? String(rapport.reac_desembouant_qte) : '',
      reac_desembouant_duree: rapport?.reac_desembouant_duree || '',
      produit_inhibiteur_nom: rapport?.produit_inhibiteur_nom || '',
      produit_inhibiteur_qte: rapport?.produit_inhibiteur_qte != null ? String(rapport.produit_inhibiteur_qte) : '',
      ph_avant: rapport?.ph_avant != null ? String(rapport.ph_avant) : '',
      ph_apres: rapport?.ph_apres != null ? String(rapport.ph_apres) : '',
      temperature_avant: rapport?.temperature_avant != null ? String(rapport.temperature_avant) : '',
      temperature_apres: rapport?.temperature_apres != null ? String(rapport.temperature_apres) : '',
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
        site_nb_batiments: toNumber(data.site_nb_batiments),
        site_nb_appartements: toNumber(data.site_nb_appartements),
        reac_desembouant_qte: toNumber(data.reac_desembouant_qte),
        produit_inhibiteur_qte: toNumber(data.produit_inhibiteur_qte),
        ph_avant: toNumber(data.ph_avant),
        ph_apres: toNumber(data.ph_apres),
        temperature_avant: toNumber(data.temperature_avant),
        temperature_apres: toNumber(data.temperature_apres),
        prestataire_logo_url: logoUrl,
        nb_emetteurs: nbEmetteurs,
        volume_eau_estimatif: volumeEstimatif,
        volume_total_eau: volumeTotal,
        photos_produits: photosProduits,
        photos_vue_aerienne: photosVueAerienne,
        photos_batiments: photosBatiments,
        photos_boues: photosBoues,
        photos_justificatifs: photosJustificatifs,
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
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg">Site d&apos;intervention</h3>
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
              <label className="block text-sm font-medium mb-1.5">Nombre de bâtiments</label>
              <input type="number" {...register('site_nb_batiments')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre d&apos;appartements</label>
              <input type="number" {...register('site_nb_appartements')} className={inputClass} />
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
          <h3 className="font-semibold text-lg">Données techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type d&apos;installation</label>
              <select {...register('type_installation')} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="Réseau de chaleur">Réseau de chaleur</option>
                <option value="Chaudière à condensation">Chaudière à condensation</option>
                <option value="Chaudière classique">Chaudière classique</option>
                <option value="Pompe à chaleur">Pompe à chaleur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type de réseau</label>
              <select {...register('type_reseau')} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="Acier">Acier</option>
                <option value="Cuivre">Cuivre</option>
                <option value="PER">PER</option>
                <option value="Multicouche">Multicouche</option>
              </select>
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

        {/* Produits & Résultats */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg">Produits utilisés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Réactif désembouant</label>
              <input {...register('reac_desembouant_nom')} className={inputClass} placeholder="Nom du produit" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité (L)</label>
              <input type="number" step="0.1" {...register('reac_desembouant_qte')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Durée de traitement</label>
              <input {...register('reac_desembouant_duree')} className={inputClass} placeholder="Ex: 48h" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Inhibiteur de corrosion</label>
              <input {...register('produit_inhibiteur_nom')} className={inputClass} placeholder="Nom du produit" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantité (L)</label>
              <input type="number" step="0.1" {...register('produit_inhibiteur_qte')} className={inputClass} />
            </div>
          </div>

          <h3 className="font-semibold text-lg pt-4">Résultats des mesures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">pH avant traitement</label>
              <input type="number" step="0.1" {...register('ph_avant')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">pH après traitement</label>
              <input type="number" step="0.1" {...register('ph_apres')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Température avant (°C)</label>
              <input type="number" step="0.1" {...register('temperature_avant')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Température après (°C)</label>
              <input type="number" step="0.1" {...register('temperature_apres')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg">Photos</h3>
          <PhotoUpload photos={photosProduits} onChange={setPhotosProduits} label="Photos produits" />
          <PhotoUpload photos={photosVueAerienne} onChange={setPhotosVueAerienne} label="Vue aérienne" />
          <PhotoUpload photos={photosBatiments} onChange={setPhotosBatiments} label="Photos bâtiments" />
          <PhotoUpload photos={photosBoues} onChange={setPhotosBoues} label="Photos boues" />
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
