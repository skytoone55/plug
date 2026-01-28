'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equilibrageSchema, type EquilibrageFormData, toNumber } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
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
  const [activeSection, setActiveSection] = useState(0)

  // Photos state
  const [photosChaufferie, setPhotosChaufferie] = useState<string[]>(rapport?.photos_chaufferie || [])
  const [photosEquipement, setPhotosEquipement] = useState<string[]>(rapport?.photos_equipement || [])
  const [photosIntervention, setPhotosIntervention] = useState<string[]>(rapport?.photos_intervention || [])
  const [signatureTech, setSignatureTech] = useState<string | null>(rapport?.signature_technicien || null)
  const [signatureClient, setSignatureClient] = useState<string | null>(rapport?.signature_client || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(rapport?.prestataire_logo_url || null)

  const { register, handleSubmit, control, formState: { errors } } = useForm<EquilibrageFormData>({
    resolver: zodResolver(equilibrageSchema),
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
      site_ref_cadastrale: rapport?.site_ref_cadastrale || '',
      site_nb_batiments: rapport?.site_nb_batiments != null ? String(rapport.site_nb_batiments) : '',
      site_nb_niveaux: rapport?.site_nb_niveaux != null ? String(rapport.site_nb_niveaux) : '',
      site_nb_lots: rapport?.site_nb_lots != null ? String(rapport.site_nb_lots) : '',
      technicien_nom: rapport?.technicien_nom || '',
      technicien_prenom: rapport?.technicien_prenom || '',
      technicien_date_intervention: rapport?.technicien_date_intervention || '',
      description_reseau: rapport?.description_reseau || '',
      methode_equilibrage: rapport?.methode_equilibrage || '',
      commentaire_chaufferie: rapport?.commentaire_chaufferie || '',
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
    } as MesureTemperature)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `logos/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file)
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
      setLogoUrl(urlData.publicUrl)
    }
  }

  const onSubmit = async (data: EquilibrageFormData) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...data,
        site_nb_batiments: toNumber(data.site_nb_batiments),
        site_nb_niveaux: toNumber(data.site_nb_niveaux),
        site_nb_lots: toNumber(data.site_nb_lots),
        tab_mesure_debit: data.tab_mesure_debit || [],
        tab_mesure_temperature: data.tab_mesure_temperature || [],
        user_id: user?.id,
        prestataire_logo_url: logoUrl,
        photos_chaufferie: photosChaufferie,
        photos_equipement: photosEquipement,
        photos_intervention: photosIntervention,
        signature_technicien: signatureTech,
        signature_client: signatureClient,
        updated_at: new Date().toISOString(),
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('rapports_equilibrage')
          .insert(payload)
        if (insertError) throw insertError
      } else {
        const { error: updateError } = await supabase
          .from('rapports_equilibrage')
          .update(payload)
          .eq('id', rapport!.id)
        if (updateError) throw updateError
      }

      router.push('/dashboard/rapport-list')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    'Informations Générales',
    'Description & Méthodologie',
    'Installation & Réseaux',
    'Mesures de Débit',
    'Températures',
    'Photos',
    'Signatures',
  ]

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

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {sections.map((section, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSection(i)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeSection === i
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {i + 1}. {section}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1: Informations Générales */}
        {activeSection === 0 && (
          <div className="bg-card rounded-xl border p-6 space-y-6">
            {/* Bénéficiaire */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Bénéficiaire</h3>
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
            <div>
              <h3 className="font-semibold text-lg mb-4">Prestataire</h3>
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

            {/* Site */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Site d&apos;intervention</h3>
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
                  <input {...register('site_ref_cadastrale')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre de bâtiments</label>
                  <input type="number" {...register('site_nb_batiments')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre de niveaux</label>
                  <input type="number" {...register('site_nb_niveaux')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre de lots</label>
                  <input type="number" {...register('site_nb_lots')} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Technicien */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Technicien</h3>
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
          </div>
        )}

        {/* Section 2: Description & Méthodologie */}
        {activeSection === 1 && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Description du réseau</label>
              <textarea
                {...register('description_reseau')}
                rows={6}
                className={inputClass}
                placeholder="Décrire le réseau de distribution..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Méthodologie d&apos;équilibrage</label>
              <textarea
                {...register('methode_equilibrage')}
                rows={6}
                className={inputClass}
                placeholder="Décrire la méthode utilisée..."
              />
            </div>
          </div>
        )}

        {/* Section 3: Installation & Réseaux (optionnel) */}
        {activeSection === 2 && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              Cette section est optionnelle. Si remplie, elle apparaîtra comme section &quot;Installation et Réseaux&quot; dans le rapport.
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Commentaire chaufferie</label>
              <textarea
                {...register('commentaire_chaufferie')}
                rows={6}
                className={inputClass}
                placeholder="Commentaires sur la chaufferie..."
              />
            </div>
            <PhotoUpload
              photos={photosChaufferie}
              onChange={setPhotosChaufferie}
              label="Photos de la chaufferie"
            />
          </div>
        )}

        {/* Section 4: Mesures de Débit */}
        {activeSection === 3 && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tableau des mesures de débit</h3>
              <button
                type="button"
                onClick={addDebitRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Ajouter une vanne
              </button>
            </div>

            {debitFields.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-2">Bâtiment</th>
                      <th className="text-left py-2 px-2">Localisation</th>
                      <th className="text-left py-2 px-2">Repérage</th>
                      <th className="text-left py-2 px-2">Référence</th>
                      <th className="text-left py-2 px-2">Marque</th>
                      <th className="text-left py-2 px-2">DN</th>
                      <th className="text-left py-2 px-2">Débit théo.</th>
                      <th className="text-left py-2 px-2">Débit mesuré</th>
                      <th className="text-left py-2 px-2">Réglage</th>
                      <th className="text-left py-2 px-2">Conf.</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {debitFields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.batimentNo`)} className="w-16 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.localisation`)} className="w-24 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.reperage`)} className="w-16 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.reference`)} className="w-24 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.marque`)} className="w-24 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.dn`)} className="w-14 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.debitTheorique`)} className="w-20 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.debitMesure`)} className="w-20 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <input {...register(`tab_mesure_debit.${index}.reglage`)} className="w-16 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-1">
                          <select {...register(`tab_mesure_debit.${index}.conformite`)} className="px-2 py-1 border rounded text-sm">
                            <option value="C">C</option>
                            <option value="NC">NC</option>
                            <option value="NE">NE</option>
                          </select>
                        </td>
                        <td className="py-1 px-1">
                          <button type="button" onClick={() => removeDebit(index)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune mesure. Cliquez sur &quot;Ajouter une vanne&quot; pour commencer.
              </p>
            )}
          </div>
        )}

        {/* Section 5: Températures */}
        {activeSection === 4 && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Relevé de températures</h3>
              <button
                type="button"
                onClick={addTempRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Ajouter une mesure
              </button>
            </div>

            {tempFields.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3">Bâtiment N°</th>
                      <th className="text-left py-2 px-3">Nom du bâtiment</th>
                      <th className="text-left py-2 px-3">Niveau</th>
                      <th className="text-left py-2 px-3">Température mesurée (°C)</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempFields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="py-1 px-2">
                          <input {...register(`tab_mesure_temperature.${index}.batimentNo`)} className="w-20 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-2">
                          <input {...register(`tab_mesure_temperature.${index}.batimentNom`)} className="w-full px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-2">
                          <input {...register(`tab_mesure_temperature.${index}.niveau`)} className="w-full px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-2">
                          <input {...register(`tab_mesure_temperature.${index}.temperatureMesuree`)} className="w-24 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="py-1 px-2">
                          <button type="button" onClick={() => removeTemp(index)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune mesure de température.
              </p>
            )}
          </div>
        )}

        {/* Section 6: Photos */}
        {activeSection === 5 && (
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <PhotoUpload
              photos={photosEquipement}
              onChange={setPhotosEquipement}
              label="Photos équipement"
            />
            <PhotoUpload
              photos={photosIntervention}
              onChange={setPhotosIntervention}
              label="Photos intervention"
            />
          </div>
        )}

        {/* Section 7: Signatures */}
        {activeSection === 6 && (
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <SignatureField
              label="Signature du technicien"
              value={signatureTech}
              onChange={setSignatureTech}
            />
            <SignatureField
              label="Signature du client"
              value={signatureClient}
              onChange={setSignatureClient}
            />
          </div>
        )}

        {/* Error & Actions */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {activeSection > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection(activeSection - 1)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Précédent
              </button>
            )}
            {activeSection < sections.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveSection(activeSection + 1)}
                className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
              >
                Suivant
              </button>
            )}
          </div>
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
