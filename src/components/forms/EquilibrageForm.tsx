'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equilibrageSchema, type EquilibrageFormData, toNumber } from '@/lib/validations'
import type { RapportEquilibrage, MesureDebit, MesureTemperature } from '@/lib/types'
import PhotoUpload from './PhotoUpload'
import SignatureField from './SignatureField'
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EquilibrageFormProps {
  rapport?: RapportEquilibrage
  mode: 'create' | 'edit'
}

export default function EquilibrageForm({ rapport, mode }: EquilibrageFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photos state
  const [photosChaufferie, setPhotosChaufferie] = useState<string[]>(rapport?.photos_chaufferie || [])
  const [photosSite, setPhotosSite] = useState<string[]>(rapport?.photos_site || rapport?.photos_equipement || [])
  const [photosVannes, setPhotosVannes] = useState<string[]>(rapport?.photos_vannes || [])
  const [photosAutres, setPhotosAutres] = useState<string[]>(rapport?.photos_autres || rapport?.photos_intervention || [])
  const [signatureTech, setSignatureTech] = useState<string | null>(rapport?.signature_technicien || null)
  const [signatureClient, setSignatureClient] = useState<string | null>(rapport?.signature_client || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(rapport?.prestataire_logo_url || null)

  const { register, handleSubmit, control } = useForm<EquilibrageFormData>({
    resolver: zodResolver(equilibrageSchema),
    defaultValues: {
      fiche: rapport?.fiche || '',
      type_installation: rapport?.type_installation || '',
      beneficiaire_nom: rapport?.beneficiaire_nom || '',
      beneficiaire_adresse: rapport?.beneficiaire_adresse || '',
      beneficiaire_code_postal: rapport?.beneficiaire_code_postal || '',
      beneficiaire_ville: rapport?.beneficiaire_ville || '',
      beneficiaire_telephone: rapport?.beneficiaire_telephone || '',
      beneficiaire_email: rapport?.beneficiaire_email || '',
      siren_beneficiaire: rapport?.siren_beneficiaire || '',
      prestataire_nom: rapport?.prestataire_nom || '',
      prestataire_adresse: rapport?.prestataire_adresse || '',
      prestataire_code_postal: rapport?.prestataire_code_postal || '',
      prestataire_ville: rapport?.prestataire_ville || '',
      prestataire_telephone: rapport?.prestataire_telephone || '',
      prestataire_email: rapport?.prestataire_email || '',
      siren_prestataire: rapport?.siren_prestataire || '',
      intervenant_nom: rapport?.intervenant_nom || '',
      siret_intervenant: rapport?.siret_intervenant || '',
      site_adresse: rapport?.site_adresse || '',
      site_code_postal: rapport?.site_code_postal || '',
      site_ville: rapport?.site_ville || '',
      site_ref_cadastrale: rapport?.site_ref_cadastrale || '',
      site_nb_batiments: rapport?.site_nb_batiments != null ? String(rapport.site_nb_batiments) : '',
      site_nb_niveaux: rapport?.site_nb_niveaux != null ? String(rapport.site_nb_niveaux) : '',
      site_nb_lots: rapport?.site_nb_lots != null ? String(rapport.site_nb_lots) : '',
      surface_chauffee: rapport?.surface_chauffee != null ? String(rapport.surface_chauffee) : '',
      technicien_nom: rapport?.technicien_nom || '',
      technicien_prenom: rapport?.technicien_prenom || '',
      technicien_date_intervention: rapport?.technicien_date_intervention || '',
      description_reseau: rapport?.description_reseau || '',
      releves_site: rapport?.releves_site || '',
      considerations: rapport?.considerations || '',
      methode_equilibrage: rapport?.methode_equilibrage || '',
      nom_equipement: rapport?.nom_equipement || '',
      commentaire_chaufferie: rapport?.commentaire_chaufferie || '',
      temperature_exterieure: rapport?.temperature_exterieure || '',
      tab_mesure_debit: rapport?.tab_mesure_debit || [],
      tab_mesure_temperature: rapport?.tab_mesure_temperature || [],
    },
  })

  const { fields: debitFields, append: appendDebit, remove: removeDebit } = useFieldArray({
    control,
    name: 'tab_mesure_debit',
  })

  const { fields: tempFields, append: appendTemp, remove: removeTemp } = useFieldArray({
    control,
    name: 'tab_mesure_temperature',
  })

  const addDebitRow = () => {
    appendDebit({
      id: crypto.randomUUID(),
      batimentNo: '',
      batimentNom: '',
      nbNiveau: '',
      localisation: '',
      reperage: '',
      reference: '',
      marque: '',
      dn: '',
      debitTheorique: '',
      debitMesure: '',
      reglage: '',
      conformite: 'C',
    } as MesureDebit)
  }

  const addTempRow = () => {
    appendTemp({
      id: crypto.randomUUID(),
      batimentNo: '',
      batimentNom: '',
      niveau: '',
      temperatureMesuree: '',
      temperatureExterieure: '',
      date: '',
      heure: '',
    } as MesureTemperature)
  }

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

  const onSubmit = async (data: EquilibrageFormData) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
        site_nb_batiments: toNumber(data.site_nb_batiments),
        site_nb_niveaux: toNumber(data.site_nb_niveaux),
        site_nb_lots: toNumber(data.site_nb_lots),
        surface_chauffee: toNumber(data.surface_chauffee),
        tab_mesure_debit: data.tab_mesure_debit || [],
        tab_mesure_temperature: data.tab_mesure_temperature || [],
        prestataire_logo_url: logoUrl,
        photos_chaufferie: photosChaufferie,
        photos_site: photosSite,
        photos_vannes: photosVannes,
        photos_autres: photosAutres,
        photos_equipement: photosSite,
        photos_intervention: photosAutres,
        signature_technicien: signatureTech,
        signature_client: signatureClient,
        ...(mode === 'edit' ? { id: rapport!.id } : {}),
      }

      const res = await fetch('/api/rapports/equilibrage', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la sauvegarde')

      router.push('/dashboard/rapport-list')
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
        <Link href="/dashboard/rapport-list" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Nouveau rapport d\'équilibrage' : 'Modifier le rapport'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Section 1 : Informations Générales */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Informations Générales</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fiche</label>
              <select {...register('fiche')} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="BAR-SE-103">BAR-SE-103</option>
                <option value="BAR-SE-104">BAR-SE-104</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type d&apos;installation</label>
              <select {...register('type_installation')} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="Chauffage à eau chaude">Chauffage à eau chaude</option>
                <option value="Climatisation">Climatisation</option>
              </select>
            </div>
          </div>

          {/* Bénéficiaire */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bénéficiaire</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Bénéficiaire</label>
                <input {...register('beneficiaire_nom')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SIREN Bénéficiaire</label>
                <input {...register('siren_beneficiaire')} className={inputClass} />
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
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input {...register('beneficiaire_email')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Prestataire */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Prestataire</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Prestataire</label>
                <input {...register('prestataire_nom')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SIREN Prestataire</label>
                <input {...register('siren_prestataire')} className={inputClass} />
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
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input {...register('prestataire_email')} className={inputClass} />
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

          {/* Intervenant */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Intervenant</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Intervenant</label>
                <input {...register('intervenant_nom')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SIRET Intervenant</label>
                <input {...register('siret_intervenant')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Site */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Site</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Site (adresse)</label>
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
                <label className="block text-sm font-medium mb-1.5">Surface chauffée (m²)</label>
                <input type="number" {...register('surface_chauffee')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de lots</label>
                <input type="number" {...register('site_nb_lots')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Technicien */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Technicien</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Date d&apos;intervention</label>
                <input type="date" {...register('technicien_date_intervention')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Technicien (nom)</label>
                <input {...register('technicien_nom')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Technicien (prénom)</label>
                <input {...register('technicien_prenom')} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Description & Méthodologie */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Description &amp; Méthodologie</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description_reseau')} rows={4} className={inputClass} placeholder="Description du réseau de distribution..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Relevés sur site</label>
            <textarea {...register('releves_site')} rows={4} className={inputClass} placeholder="Relevés effectués sur site..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Considérations</label>
            <textarea {...register('considerations')} rows={4} className={inputClass} placeholder="Considérations techniques..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Méthodologie</label>
            <textarea {...register('methode_equilibrage')} rows={4} className={inputClass} placeholder="Méthode d'équilibrage utilisée..." />
          </div>
        </div>

        {/* Section 3 : Équipements (Chaufferie) */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Équipements (Chaufferie)</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom équipement</label>
            <input {...register('nom_equipement')} className={inputClass} placeholder="Nom de l'équipement" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Commentaire chaufferie</label>
            <textarea {...register('commentaire_chaufferie')} rows={3} className={inputClass} placeholder="Commentaires sur la chaufferie..." />
          </div>
          <PhotoUpload photos={photosChaufferie} onChange={setPhotosChaufferie} label="Photos équipement" />
        </div>

        {/* Section 4 : Tableau d'Équilibrage */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-lg">Tableau de relevé d&apos;équilibrage</h3>
            <button type="button" onClick={addDebitRow} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Ajouter une vanne
            </button>
          </div>

          {debitFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-1 text-xs">Bât.</th>
                    <th className="text-left py-2 px-1 text-xs">Nom bât.</th>
                    <th className="text-left py-2 px-1 text-xs">Nb niv.</th>
                    <th className="text-left py-2 px-1 text-xs">Repérage</th>
                    <th className="text-left py-2 px-1 text-xs">Localisation</th>
                    <th className="text-left py-2 px-1 text-xs">Référence</th>
                    <th className="text-left py-2 px-1 text-xs">Marque</th>
                    <th className="text-left py-2 px-1 text-xs">DN</th>
                    <th className="text-left py-2 px-1 text-xs">Débit théo.</th>
                    <th className="text-left py-2 px-1 text-xs">Débit mes.</th>
                    <th className="text-left py-2 px-1 text-xs">Réglage</th>
                    <th className="text-left py-2 px-1 text-xs">Conf.</th>
                    <th className="py-2 px-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {debitFields.map((field, index) => (
                    <tr key={field.id} className="border-b">
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.batimentNo`)} className="w-10 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.batimentNom`)} className="w-20 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.nbNiveau`)} className="w-10 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.reperage`)} className="w-12 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.localisation`)} className="w-20 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.reference`)} className="w-16 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.marque`)} className="w-16 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.dn`)} className="w-10 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.debitTheorique`)} className="w-14 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.debitMesure`)} className="w-14 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5"><input {...register(`tab_mesure_debit.${index}.reglage`)} className="w-12 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-0.5">
                        <select {...register(`tab_mesure_debit.${index}.conformite`)} className="px-1 py-1 border rounded text-xs">
                          <option value="C">C</option>
                          <option value="NC">NC</option>
                          <option value="NE">NE</option>
                        </select>
                      </td>
                      <td className="py-1 px-0.5">
                        <button type="button" onClick={() => removeDebit(index)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune mesure. Cliquez sur &quot;Ajouter une vanne&quot; pour commencer.</p>
          )}
        </div>

        {/* Section 5 : Températures */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-lg">Tableau d&apos;enregistrement des températures</h3>
            <button type="button" onClick={addTempRow} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Ajouter une mesure
            </button>
          </div>

          {tempFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-2 text-xs">Bât.</th>
                    <th className="text-left py-2 px-2 text-xs">Nom bâtiment</th>
                    <th className="text-left py-2 px-2 text-xs">Localisation</th>
                    <th className="text-left py-2 px-2 text-xs">Temp. Ext.</th>
                    <th className="text-left py-2 px-2 text-xs">Date</th>
                    <th className="text-left py-2 px-2 text-xs">Heure</th>
                    <th className="text-left py-2 px-2 text-xs">Temp. (°C)</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {tempFields.map((field, index) => (
                    <tr key={field.id} className="border-b">
                      <td className="py-1 px-1"><input {...register(`tab_mesure_temperature.${index}.batimentNo`)} className="w-10 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1"><input {...register(`tab_mesure_temperature.${index}.batimentNom`)} className="w-24 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1"><input {...register(`tab_mesure_temperature.${index}.niveau`)} className="w-24 px-1 py-1 border rounded text-xs" placeholder="RDC, 2ème étage..." /></td>
                      <td className="py-1 px-1"><input {...register(`tab_mesure_temperature.${index}.temperatureExterieure`)} className="w-14 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1"><input type="date" {...register(`tab_mesure_temperature.${index}.date`)} className="w-28 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1"><input type="time" {...register(`tab_mesure_temperature.${index}.heure`)} className="w-20 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1"><input {...register(`tab_mesure_temperature.${index}.temperatureMesuree`)} className="w-14 px-1 py-1 border rounded text-xs" /></td>
                      <td className="py-1 px-1">
                        <button type="button" onClick={() => removeTemp(index)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune mesure de température.</p>
          )}
        </div>

        {/* Section 6 : Photos */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Photos</h3>
          <PhotoUpload photos={photosSite} onChange={setPhotosSite} label="Photos du site" />
          <PhotoUpload photos={photosVannes} onChange={setPhotosVannes} label="Photos des vannes" />
          <PhotoUpload photos={photosAutres} onChange={setPhotosAutres} label="Autres photos" />
        </div>

        {/* Section 7 : Signatures */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Signatures</h3>
          <SignatureField label="Signature intervenant" value={signatureTech} onChange={setSignatureTech} />
          <SignatureField label="Signature client" value={signatureClient} onChange={setSignatureClient} />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="flex items-center justify-end pt-4 pb-8">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Créer le rapport' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
