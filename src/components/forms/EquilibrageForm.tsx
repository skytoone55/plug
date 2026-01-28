'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equilibrageSchema, type EquilibrageFormData, toNumber } from '@/lib/validations'
import type { RapportEquilibrage, MesureDebit, MesureTemperature } from '@/lib/types'
import { FICHES_CEE, ZONES_CLIMATIQUES, LOCALISATIONS_VANNES, DIAMETRES_NOMINAUX, REFERENCES_VANNES } from '@/lib/constants/plug2drive'
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
  const [photoFacade, setPhotoFacade] = useState<string | null>(rapport?.photo_facade || null)
  const [photoCirulateur, setPhotoCirulateur] = useState<string | null>(rapport?.photo_circulateur || null)
  const [signatureTech, setSignatureTech] = useState<string | null>(rapport?.signature_technicien || null)
  const [signatureClient, setSignatureClient] = useState<string | null>(rapport?.signature_client || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(rapport?.prestataire_logo_url || null)

  const { register, handleSubmit, control, watch } = useForm<EquilibrageFormData>({
    resolver: zodResolver(equilibrageSchema),
    defaultValues: {
      // Numérotation & références (CDC)
      numero_dossier: rapport?.numero_dossier || '',
      reference_devis: rapport?.reference_devis || '',
      dossier_pixel: rapport?.dossier_pixel || '',
      // Fiche & Type
      fiche: rapport?.fiche || '',
      type_installation: rapport?.type_installation || '',
      intitule_cee: (rapport?.intitule_cee as 'BAR-SE-104' | 'BAT-SE-103') || 'BAR-SE-104',
      // Bénéficiaire
      beneficiaire_nom: rapport?.beneficiaire_nom || '',
      beneficiaire_adresse: rapport?.beneficiaire_adresse || '',
      beneficiaire_code_postal: rapport?.beneficiaire_code_postal || '',
      beneficiaire_ville: rapport?.beneficiaire_ville || '',
      beneficiaire_telephone: rapport?.beneficiaire_telephone || '',
      beneficiaire_email: rapport?.beneficiaire_email || '',
      siren_beneficiaire: rapport?.siren_beneficiaire || '',
      // Prestataire
      prestataire_nom: rapport?.prestataire_nom || '',
      prestataire_adresse: rapport?.prestataire_adresse || '',
      prestataire_code_postal: rapport?.prestataire_code_postal || '',
      prestataire_ville: rapport?.prestataire_ville || '',
      prestataire_telephone: rapport?.prestataire_telephone || '',
      prestataire_email: rapport?.prestataire_email || '',
      siren_prestataire: rapport?.siren_prestataire || '',
      // Intervenant
      intervenant_nom: rapport?.intervenant_nom || '',
      siret_intervenant: rapport?.siret_intervenant || '',
      // Site
      site_adresse: rapport?.site_adresse || '',
      adresse_ligne2: rapport?.adresse_ligne2 || '',
      site_code_postal: rapport?.site_code_postal || '',
      site_ville: rapport?.site_ville || '',
      site_ref_cadastrale: rapport?.site_ref_cadastrale || '',
      reference_cadastrale: rapport?.reference_cadastrale || '',
      site_nb_batiments: rapport?.site_nb_batiments != null ? String(rapport.site_nb_batiments) : '',
      site_nb_niveaux: rapport?.site_nb_niveaux != null ? String(rapport.site_nb_niveaux) : '',
      site_nb_lots: rapport?.site_nb_lots != null ? String(rapport.site_nb_lots) : '',
      nombre_lots: rapport?.nombre_lots != null ? String(rapport.nombre_lots) : '',
      surface_chauffee: rapport?.surface_chauffee != null ? String(rapport.surface_chauffee) : '',
      surface_chauffee_m2: rapport?.surface_chauffee_m2 != null ? String(rapport.surface_chauffee_m2) : '',
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
      // Description & Méthodologie
      description_reseau: rapport?.description_reseau || '',
      releves_site: rapport?.releves_site || '',
      considerations: rapport?.considerations || '',
      methode_equilibrage: rapport?.methode_equilibrage || '',
      // Installation
      nom_equipement: rapport?.nom_equipement || '',
      commentaire_chaufferie: rapport?.commentaire_chaufferie || '',
      type_circuit: rapport?.type_circuit || 'bitube',
      nb_colonnes_total: rapport?.nb_colonnes_total != null ? String(rapport.nb_colonnes_total) : '',
      organe_reglage_type: rapport?.organe_reglage_type || '',
      commentaire_circulateur: rapport?.commentaire_circulateur || '',
      // Température
      temperature_exterieure: rapport?.temperature_exterieure || '',
      // Tableaux dynamiques
      tab_mesure_debit: rapport?.tab_mesure_debit || [],
      tab_mesure_temperature: rapport?.tab_mesure_temperature || [],
      // Statut
      statut: rapport?.statut || 'brouillon',
    },
  })

  // Watch pour afficher conditionnellement les champs selon fiche CEE
  const intituleCee = watch('intitule_cee')

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
        // Conversions numériques
        site_nb_batiments: toNumber(data.site_nb_batiments),
        site_nb_niveaux: toNumber(data.site_nb_niveaux),
        site_nb_lots: toNumber(data.site_nb_lots),
        nombre_lots: toNumber(data.nombre_lots),
        surface_chauffee: toNumber(data.surface_chauffee),
        surface_chauffee_m2: toNumber(data.surface_chauffee_m2),
        nb_colonnes_total: toNumber(data.nb_colonnes_total),
        // Tableaux dynamiques
        tab_mesure_debit: data.tab_mesure_debit || [],
        tab_mesure_temperature: data.tab_mesure_temperature || [],
        // Photos
        prestataire_logo_url: logoUrl,
        photos_chaufferie: photosChaufferie,
        photos_site: photosSite,
        photos_vannes: photosVannes,
        photos_autres: photosAutres,
        photos_equipement: photosSite,
        photos_intervention: photosAutres,
        photo_facade: photoFacade,
        photo_circulateur: photoCirulateur,
        // Signatures
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

        {/* Section 0 : Numérotation & Fiche CEE */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fiche CEE <span className="text-destructive">*</span></label>
              <select {...register('intitule_cee')} className={inputClass}>
                <option value="BAR-SE-104">{FICHES_CEE.EQUILIBRAGE_RESIDENTIEL} - Résidentiel</option>
                <option value="BAT-SE-103">{FICHES_CEE.EQUILIBRAGE_TERTIAIRE} - Tertiaire</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {intituleCee === 'BAT-SE-103' ? 'Tertiaire : surface chauffée obligatoire' : 'Résidentiel : nombre de lots obligatoire'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type d&apos;installation</label>
              <select {...register('type_installation')} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="Chaudière condensation">Chaudière condensation</option>
                <option value="Chaudière hors condensation">Chaudière hors condensation</option>
                <option value="Réseau de chaleur">Réseau de chaleur</option>
              </select>
            </div>
          </div>

          {/* Champs conditionnels selon fiche CEE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            {intituleCee === 'BAR-SE-104' ? (
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de lots <span className="text-destructive">*</span></label>
                <input type="number" {...register('nombre_lots')} className={inputClass} placeholder="Obligatoire pour BAR-SE-104" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5">Surface chauffée (m²) <span className="text-destructive">*</span></label>
                <input type="number" {...register('surface_chauffee_m2')} className={inputClass} placeholder="Obligatoire pour BAT-SE-103" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone climatique</label>
              <select {...register('zone_climatique')} className={inputClass}>
                <option value="">Sélectionner...</option>
                {ZONES_CLIMATIQUES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 1 : Informations Générales */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Informations Générales</h3>

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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Adresse (ligne 2)</label>
                <input {...register('adresse_ligne2')} className={inputClass} placeholder="Complément d'adresse" />
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
                <label className="block text-sm font-medium mb-1.5">Nb de bâtiments</label>
                <input type="number" {...register('site_nb_batiments')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nb de niveaux</label>
                <input type="number" {...register('site_nb_niveaux')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nb de lots</label>
                <input type="number" {...register('site_nb_lots')} className={inputClass} />
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
              <div>
                <label className="block text-sm font-medium mb-1.5">Surface chauffée (m²)</label>
                <input type="number" {...register('surface_chauffee')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Contact Gardien */}
          <div className="space-y-3">
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

        {/* Section 3 : Installation & Équipements */}
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Installation &amp; Équipements</h3>

          {/* Données Installation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type de circuit</label>
              <select {...register('type_circuit')} className={inputClass}>
                <option value="bitube">Bitube</option>
                <option value="monotube">Monotube</option>
                <option value="pieuvre">Pieuvre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nb colonnes total</label>
              <input type="number" {...register('nb_colonnes_total')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type organe de réglage</label>
              <input {...register('organe_reglage_type')} className={inputClass} placeholder="STAD, HYDROCONTROL..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Température extérieure</label>
              <input {...register('temperature_exterieure')} className={inputClass} placeholder="°C" />
            </div>
          </div>

          {/* Équipement Chaufferie */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Chaufferie</h4>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom équipement</label>
              <input {...register('nom_equipement')} className={inputClass} placeholder="Nom de l'équipement" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Commentaire chaufferie</label>
              <textarea {...register('commentaire_chaufferie')} rows={3} className={inputClass} placeholder="Commentaires sur la chaufferie..." />
            </div>
            <PhotoUpload photos={photosChaufferie} onChange={setPhotosChaufferie} label="Photos chaufferie" />
          </div>

          {/* Circulateur */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Circulateur</h4>
            <div>
              <label className="block text-sm font-medium mb-1.5">Commentaire circulateur</label>
              <textarea {...register('commentaire_circulateur')} rows={2} className={inputClass} placeholder="Observations sur le circulateur..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Photo circulateur</label>
              <div className="flex items-start gap-4">
                {photoCirulateur && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoCirulateur} alt="Circulateur" className="w-32 h-32 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setPhotoCirulateur(null)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('folder', 'equilibrage/circulateur')
                    const res = await fetch('/api/upload', { method: 'POST', body: formData })
                    const data = await res.json()
                    if (data.url) setPhotoCirulateur(data.url)
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
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

          {/* Photo Façade - Obligatoire CDC */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <label className="block text-sm font-medium mb-2">
              Photo façade <span className="text-destructive">* (obligatoire)</span>
            </label>
            <div className="flex items-start gap-4">
              {photoFacade ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoFacade} alt="Façade" className="w-48 h-36 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setPhotoFacade(null)}
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
                    formData.append('folder', 'equilibrage/facade')
                    const res = await fetch('/api/upload', { method: 'POST', body: formData })
                    const data = await res.json()
                    if (data.url) setPhotoFacade(data.url)
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Photo de la façade du bâtiment - requise pour la conformité CEE
                </p>
              </div>
            </div>
          </div>

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
