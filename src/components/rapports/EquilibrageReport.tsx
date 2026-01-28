'use client'

import type { RapportEquilibrage, MesureDebit, MesureTemperature } from '@/lib/types'
import { calculerEcartTemperature } from '@/lib/formulas'
import { PLUG2DRIVE, CONFORMITES } from '@/lib/constants/plug2drive'
import SynoptiqueHydraulique from './SynoptiqueHydraulique'

interface EquilibrageReportProps {
  rapport: RapportEquilibrage
}

export default function EquilibrageReport({ rapport }: EquilibrageReportProps) {
  const hasChaufferie = !!(rapport.commentaire_chaufferie || (rapport.photos_chaufferie && rapport.photos_chaufferie.length > 0))
  const hasPhotos = !!(
    (rapport.photos_site && rapport.photos_site.length > 0) ||
    (rapport.photos_vannes && rapport.photos_vannes.length > 0) ||
    (rapport.photos_autres && rapport.photos_autres.length > 0) ||
    (rapport.photos_equipement && rapport.photos_equipement.length > 0) ||
    (rapport.photos_intervention && rapport.photos_intervention.length > 0)
  )

  // Build dynamic table of contents (CDC §7.2)
  const sections: { num: number; title: string }[] = []
  let sectionNum = 1

  sections.push({ num: sectionNum++, title: 'Informations Générales' })
  sections.push({ num: sectionNum++, title: 'Description générale de l\'installation' })
  sections.push({ num: sectionNum++, title: 'Déroulement de la mission' })
  sections.push({ num: sectionNum++, title: 'Équipements et Mesures (TA-SCOPE)' })

  if (hasChaufferie) {
    sections.push({ num: sectionNum++, title: 'Installation et Réseaux' })
  }

  sections.push({ num: sectionNum++, title: 'Tableau d\'Équilibrage' })
  sections.push({ num: sectionNum++, title: 'Relevé de Températures' })
  sections.push({ num: sectionNum++, title: 'Synoptique Hydraulique Simplifié' })

  if (hasPhotos) {
    sections.push({ num: sectionNum++, title: 'Rapport Photos' })
  }

  sections.push({ num: sectionNum++, title: 'Synthèse et Conclusion' })
  sections.push({ num: sectionNum++, title: 'Certificats de Calibration' })

  // Group measurements by building
  const debitByBatiment = (rapport.tab_mesure_debit || []).reduce((acc, m) => {
    const key = m.batimentNo || '1'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MesureDebit[]>)

  const tempByBatiment = (rapport.tab_mesure_temperature || []).reduce((acc, m) => {
    const key = m.batimentNo || '1'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MesureTemperature[]>)

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0">
      {/* Print Button */}
      <div className="max-w-[210mm] mx-auto mb-4 no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          Imprimer / Exporter PDF
        </button>
      </div>

      {/* PAGE 1: Cover (CDC §7.2 Section 1) */}
      <div className="page-a4 flex flex-col">
        {/* Header with logos */}
        <div className="flex justify-between items-start mb-8">
          {rapport.prestataire_logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={rapport.prestataire_logo_url} alt="Logo Prestataire" className="h-16 object-contain" />
          ) : (
            <div className="text-sm font-bold">{rapport.prestataire_nom || PLUG2DRIVE.nom}</div>
          )}
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold">{PLUG2DRIVE.nom}</p>
            <p>{PLUG2DRIVE.certification}</p>
          </div>
        </div>

        {/* Title and reference */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-primary mb-2">RAPPORT D&apos;ÉQUILIBRAGE</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Fiche CEE : {rapport.intitule_cee || 'BAR-SE-104'}
          </p>

          {rapport.numero_dossier && (
            <p className="text-sm font-medium mb-4">N° Dossier : {rapport.numero_dossier}</p>
          )}

          {/* Photo façade (CDC obligatoire) */}
          {rapport.photo_facade && (
            <div className="mx-auto mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rapport.photo_facade}
                alt="Façade du bâtiment"
                className="max-h-48 object-contain rounded-lg border shadow-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Vue façade du site</p>
            </div>
          )}

          <div className="text-lg space-y-1">
            <p className="font-semibold text-foreground">{rapport.site_adresse}</p>
            {rapport.adresse_ligne2 && <p className="text-sm">{rapport.adresse_ligne2}</p>}
            <p>{rapport.site_code_postal} {rapport.site_ville}</p>
            {rapport.zone_climatique && (
              <p className="text-sm">Zone climatique : {rapport.zone_climatique}</p>
            )}
          </div>

          <div className="mt-6 text-sm">
            <p>Date d&apos;intervention : <strong>{rapport.technicien_date_intervention || '-'}</strong></p>
            <p>Technicien : {rapport.technicien_prenom} {rapport.technicien_nom}</p>
          </div>
        </div>

        {/* Footer with prestataire info */}
        <div className="mt-auto pt-8 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{rapport.prestataire_nom}</p>
              <p>{rapport.prestataire_adresse}</p>
              <p>{rapport.prestataire_code_postal} {rapport.prestataire_ville}</p>
            </div>
            <div className="text-right">
              <p>{rapport.prestataire_telephone}</p>
              <p>{rapport.prestataire_email}</p>
              {rapport.siren_prestataire && <p>SIREN : {rapport.siren_prestataire}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: Table of Contents */}
      <div className="page-a4">
        <h2 className="text-2xl font-bold mb-8 text-primary">Sommaire</h2>
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.num} className="flex items-center gap-3 py-2 border-b border-dashed">
              <span className="text-primary font-bold w-8">{s.num}.</span>
              <span className="text-lg">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PAGE 3: General Information (CDC §7.2 Section 1) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Informations'))?.num}. Informations Générales
        </h2>

        {/* Références en haut */}
        {(rapport.numero_dossier || rapport.reference_devis || rapport.dossier_pixel) && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              {rapport.numero_dossier && (
                <div><span className="text-muted-foreground">N° Dossier :</span> <strong>{rapport.numero_dossier}</strong></div>
              )}
              {rapport.reference_devis && (
                <div><span className="text-muted-foreground">Réf. Devis :</span> {rapport.reference_devis}</div>
              )}
              {rapport.dossier_pixel && (
                <div><span className="text-muted-foreground">Pixel :</span> {rapport.dossier_pixel}</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Bénéficiaire */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Bénéficiaire</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{rapport.beneficiaire_nom}</p>
              <p>{rapport.beneficiaire_adresse}</p>
              <p>{rapport.beneficiaire_code_postal} {rapport.beneficiaire_ville}</p>
              <p>{rapport.beneficiaire_telephone}</p>
              <p>{rapport.beneficiaire_email}</p>
              {rapport.siren_beneficiaire && <p className="text-xs text-muted-foreground">SIREN : {rapport.siren_beneficiaire}</p>}
            </div>
          </div>

          {/* Prestataire */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Prestataire</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{rapport.prestataire_nom}</p>
              <p>{rapport.prestataire_adresse}</p>
              <p>{rapport.prestataire_code_postal} {rapport.prestataire_ville}</p>
              <p>{rapport.prestataire_telephone}</p>
              <p>{rapport.prestataire_email}</p>
              {rapport.siren_prestataire && <p className="text-xs text-muted-foreground">SIREN : {rapport.siren_prestataire}</p>}
            </div>
          </div>

          {/* Site */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Site d&apos;intervention</h3>
            <div className="space-y-1 text-sm">
              <p>{rapport.site_adresse}</p>
              {rapport.adresse_ligne2 && <p>{rapport.adresse_ligne2}</p>}
              <p>{rapport.site_code_postal} {rapport.site_ville}</p>
              {rapport.reference_cadastrale && <p>Réf. cadastrale : {rapport.reference_cadastrale}</p>}
              <p>
                Bâtiments : {rapport.site_nb_batiments || '-'} |
                Niveaux : {rapport.site_nb_niveaux || '-'} |
                {rapport.intitule_cee === 'BAT-SE-103'
                  ? ` Surface : ${rapport.surface_chauffee_m2 || '-'} m²`
                  : ` Lots : ${rapport.nombre_lots || rapport.site_nb_lots || '-'}`
                }
              </p>
              {rapport.zone_climatique && <p>Zone climatique : {rapport.zone_climatique}</p>}
            </div>
          </div>

          {/* Technicien & Intervenant */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Intervention</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Technicien : {rapport.technicien_prenom} {rapport.technicien_nom}</p>
              <p>Date : {rapport.technicien_date_intervention || '-'}</p>
              {rapport.intervenant_nom && (
                <>
                  <p className="mt-2 font-medium">Intervenant : {rapport.intervenant_nom}</p>
                  {rapport.siret_intervenant && <p className="text-xs text-muted-foreground">SIRET : {rapport.siret_intervenant}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Gardien (si renseigné) */}
        {(rapport.gardien_nom || rapport.gardien_tel) && (
          <div className="mt-6 border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Contact Gardien</h3>
            <div className="text-sm">
              <p>{rapport.gardien_nom} {rapport.gardien_tel && `- ${rapport.gardien_tel}`}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description générale */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Description'))?.num}. Description générale de l&apos;installation
        </h2>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {rapport.description_reseau || (
            <div className="text-muted-foreground italic">
              L&apos;installation de chauffage collectif dessert {rapport.site_nb_batiments || 'plusieurs'} bâtiment(s)
              sur {rapport.site_nb_niveaux || 'plusieurs'} niveau(x).
              Le réseau de distribution est de type {rapport.type_circuit || 'bitube'}.
              {rapport.nb_colonnes_total && ` Le réseau comporte ${rapport.nb_colonnes_total} colonne(s) au total.`}
            </div>
          )}
        </div>

        {/* Caractéristiques installation */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Type d&apos;installation</h4>
            <p>{rapport.type_installation || '-'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Type de circuit</h4>
            <p>{rapport.type_circuit || 'Bitube'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Nb colonnes total</h4>
            <p>{rapport.nb_colonnes_total || '-'}</p>
          </div>
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Organe de réglage</h4>
            <p>{rapport.organe_reglage_type || '-'}</p>
          </div>
        </div>
      </div>

      {/* Déroulement de la mission (CDC §7.2 Section 3) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Déroulement'))?.num}. Déroulement de la mission
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Méthodologie d&apos;équilibrage</h4>
            <div className="whitespace-pre-wrap leading-relaxed border-l-4 border-primary/30 pl-4">
              {rapport.methode_equilibrage || (
                <p className="text-muted-foreground italic">
                  L&apos;équilibrage a été réalisé selon la méthode proportionnelle en utilisant
                  un débitmètre à ultrasons de type TA-SCOPE. Les mesures ont été effectuées
                  sur l&apos;ensemble des organes de réglage du réseau de distribution.
                </p>
              )}
            </div>
          </div>

          {rapport.releves_site && (
            <div>
              <h4 className="font-semibold mb-2">Relevés sur site</h4>
              <div className="whitespace-pre-wrap leading-relaxed border-l-4 border-primary/30 pl-4">
                {rapport.releves_site}
              </div>
            </div>
          )}

          {rapport.considerations && (
            <div>
              <h4 className="font-semibold mb-2">Considérations techniques</h4>
              <div className="whitespace-pre-wrap leading-relaxed border-l-4 border-primary/30 pl-4">
                {rapport.considerations}
              </div>
            </div>
          )}

          {/* Température extérieure si renseignée */}
          {rapport.temperature_exterieure && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <p>
                <strong>Température extérieure lors de l&apos;intervention :</strong> {rapport.temperature_exterieure}°C
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Équipements TA-SCOPE (CDC §7.2 Section 5) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Équipements'))?.num}. Équipements et Mesures (TA-SCOPE)
        </h2>

        <div className="space-y-6">
          <p className="text-sm">
            Les mesures de débit ont été réalisées à l&apos;aide d&apos;un appareil de mesure
            <strong> TA-SCOPE IMI Hydronic Engineering</strong>, débitmètre à ultrasons certifié et calibré.
          </p>

          {/* Placeholder pour images TA-SCOPE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 text-center bg-muted/20">
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/templates/tascope-exemple.png" alt="TA-SCOPE" className="max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Appareil de mesure TA-SCOPE</p>
            </div>
            <div className="border rounded-lg p-4 text-sm">
              <h4 className="font-semibold mb-2">Caractéristiques techniques</h4>
              <ul className="space-y-1 text-xs">
                <li>• Débitmètre à ultrasons</li>
                <li>• Précision : ±2%</li>
                <li>• Plage de mesure : 0-3000 l/h</li>
                <li>• Calibration annuelle certifiée</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note : Les certificats de calibration sont joints en annexe du présent rapport.
          </p>
        </div>
      </div>

      {/* Tableau d'Équilibrage */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Tableau'))?.num}. Tableau d&apos;Équilibrage
        </h2>

        {Object.entries(debitByBatiment).map(([batNo, mesures]) => (
          <div key={batNo} className="mb-6 avoid-break">
            <div className="bg-primary/10 px-3 py-2 rounded-t-lg">
              <span className="font-semibold text-sm">
                Bâtiment {batNo} | Nb niveau : {rapport.site_nb_niveaux || '-'}
              </span>
            </div>
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="py-1.5 px-2 text-left border">Repérage</th>
                  <th className="py-1.5 px-2 text-left border">Localisation</th>
                  <th className="py-1.5 px-2 text-left border">Référence</th>
                  <th className="py-1.5 px-2 text-left border">Marque</th>
                  <th className="py-1.5 px-2 text-left border">DN</th>
                  <th className="py-1.5 px-2 text-left border">Débit théo.</th>
                  <th className="py-1.5 px-2 text-left border">Débit mesuré</th>
                  <th className="py-1.5 px-2 text-left border">Réglage</th>
                  <th className="py-1.5 px-2 text-left border">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {mesures.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="py-1 px-2 border">{m.reperage}</td>
                    <td className="py-1 px-2 border">{m.localisation}</td>
                    <td className="py-1 px-2 border">{m.reference}</td>
                    <td className="py-1 px-2 border">{m.marque}</td>
                    <td className="py-1 px-2 border">{m.dn}</td>
                    <td className="py-1 px-2 border">{m.debitTheorique}</td>
                    <td className="py-1 px-2 border">{m.debitMesure}</td>
                    <td className="py-1 px-2 border">{m.reglage}</td>
                    <td className="py-1 px-2 border font-medium">
                      <span className={
                        m.conformite === 'C' ? 'text-green-600' :
                        m.conformite === 'NC' ? 'text-red-600' : 'text-gray-500'
                      }>
                        {m.conformite}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="text-xs text-muted-foreground mt-4">
          <p>C = Conforme | NC = Non Conforme | NE = Non Exploité</p>
        </div>
      </div>

      {/* Installation & Réseaux (conditionnel) */}
      {hasChaufferie && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-4 text-primary">
            {sections.find(s => s.title.includes('Installation'))?.num}. Installation et Réseaux
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed mb-6">
            {rapport.commentaire_chaufferie}
          </div>
          {rapport.photos_chaufferie && rapport.photos_chaufferie.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {rapport.photos_chaufferie.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={url} alt={`Chaufferie ${i + 1}`} className="rounded-lg object-cover w-full" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Relevé de Températures */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Températures'))?.num}. Relevé de Températures
        </h2>

        {Object.entries(tempByBatiment).map(([batNo, mesures]) => (
          <div key={batNo} className="mb-6 avoid-break">
            <div className="bg-primary/10 px-3 py-2 rounded-t-lg">
              <span className="font-semibold text-sm">Bâtiment {batNo}</span>
            </div>
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="py-1.5 px-2 text-left border">Bâtiment</th>
                  <th className="py-1.5 px-2 text-left border">Nom</th>
                  <th className="py-1.5 px-2 text-left border">Niveau</th>
                  <th className="py-1.5 px-2 text-left border">Température (°C)</th>
                  <th className="py-1.5 px-2 text-left border">Écart (°C)</th>
                </tr>
              </thead>
              <tbody>
                {mesures.map((m, idx) => {
                  const prevTemp = idx > 0
                    ? parseFloat(mesures[idx - 1].temperatureMesuree)
                    : null
                  const currentTemp = parseFloat(m.temperatureMesuree)
                  const ecart = calculerEcartTemperature(currentTemp, prevTemp)

                  return (
                    <tr key={m.id} className="border-b">
                      <td className="py-1 px-2 border">{m.batimentNo}</td>
                      <td className="py-1 px-2 border">{m.batimentNom}</td>
                      <td className="py-1 px-2 border">{m.niveau}</td>
                      <td className="py-1 px-2 border">{m.temperatureMesuree}</td>
                      <td className="py-1 px-2 border">
                        {ecart !== null ? ecart : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Synoptique Hydraulique */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Synoptique'))?.num}. Synoptique Hydraulique Simplifié
        </h2>
        <SynoptiqueHydraulique mesures={rapport.tab_mesure_debit || []} />
      </div>

      {/* Rapport Photos (CDC §7.2 Section 9) */}
      {hasPhotos && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-4 text-primary">
            {sections.find(s => s.title.includes('Rapport Photos'))?.num}. Rapport Photos
          </h2>

          {/* Photo façade */}
          {rapport.photo_facade && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photo Façade</h3>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rapport.photo_facade} alt="Façade" className="rounded-lg object-cover max-h-48" />
              </div>
            </div>
          )}

          {/* Photos site */}
          {rapport.photos_site && rapport.photos_site.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photos Site</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_site.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Site ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
                ))}
              </div>
            </div>
          )}

          {/* Photos vannes */}
          {rapport.photos_vannes && rapport.photos_vannes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photos Vannes d&apos;équilibrage</h3>
              <div className="grid grid-cols-3 gap-3">
                {rapport.photos_vannes.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Vanne ${i + 1}`} className="rounded-lg object-cover w-full max-h-32" />
                ))}
              </div>
            </div>
          )}

          {/* Photos circulateur */}
          {rapport.photo_circulateur && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photo Circulateur</h3>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rapport.photo_circulateur} alt="Circulateur" className="rounded-lg object-cover max-h-40" />
              </div>
              {rapport.commentaire_circulateur && (
                <p className="text-xs text-muted-foreground text-center mt-2">{rapport.commentaire_circulateur}</p>
              )}
            </div>
          )}

          {/* Photos équipement (legacy) */}
          {rapport.photos_equipement && rapport.photos_equipement.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photos Équipement</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_equipement.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Équipement ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
                ))}
              </div>
            </div>
          )}

          {/* Photos autres */}
          {rapport.photos_autres && rapport.photos_autres.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Autres Photos</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_autres.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
                ))}
              </div>
            </div>
          )}

          {/* Photos intervention (legacy) */}
          {rapport.photos_intervention && rapport.photos_intervention.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Photos Intervention</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_intervention.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Intervention ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Synthèse et Conclusion (CDC §7.2 Section 10) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Synthèse'))?.num}. Synthèse et Conclusion
        </h2>

        {/* Résumé des mesures */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{rapport.tab_mesure_debit?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Vannes mesurées</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {rapport.tab_mesure_debit?.filter(v => v.conformite === 'C').length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Conformes</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {rapport.tab_mesure_debit?.filter(v => v.conformite === 'NC').length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Non conformes</p>
            </div>
          </div>

          {/* Écart température */}
          {rapport.tab_mesure_temperature && rapport.tab_mesure_temperature.length > 1 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              {(() => {
                const temps = rapport.tab_mesure_temperature
                  .map(t => parseFloat(t.temperatureMesuree))
                  .filter(t => !isNaN(t))
                const ecart = temps.length > 1 ? Math.max(...temps) - Math.min(...temps) : 0
                const isOk = ecart < 2

                return (
                  <p className="text-sm">
                    <strong>Écart de température mesuré :</strong>{' '}
                    <span className={isOk ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {ecart.toFixed(1)}°C
                    </span>
                    {' '}
                    {isOk
                      ? '✓ Conforme (< 2°C selon exigence CEE)'
                      : '✗ Non conforme (> 2°C - exigence CEE)'
                    }
                  </p>
                )
              })()}
            </div>
          )}
        </div>

        <p className="text-sm mb-8">
          L&apos;ensemble des opérations d&apos;équilibrage a été réalisé conformément aux normes en vigueur
          et aux exigences de la fiche CEE <strong>{rapport.intitule_cee || 'BAR-SE-104'}</strong>.
          Les résultats des mesures sont consignés dans le présent rapport.
        </p>

        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="text-center">
            <p className="font-medium mb-4">Signature du technicien</p>
            <div className="h-24 flex items-center justify-center">
              {rapport.signature_technicien ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={rapport.signature_technicien} alt="Signature technicien" className="max-h-full" />
              ) : (
                <div className="border-2 border-dashed rounded w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Signature
                </div>
              )}
            </div>
            <div className="border-t mt-4 pt-2 text-sm">
              {rapport.technicien_prenom} {rapport.technicien_nom}
              <p className="text-xs text-muted-foreground">Date : {rapport.technicien_date_intervention}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium mb-4">Signature du client</p>
            <div className="h-24 flex items-center justify-center">
              {rapport.signature_client ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={rapport.signature_client} alt="Signature client" className="max-h-full" />
              ) : (
                <div className="border-2 border-dashed rounded w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Signature
                </div>
              )}
            </div>
            <div className="border-t mt-4 pt-2 text-sm">
              Le bénéficiaire
              <p className="text-xs text-muted-foreground">{rapport.beneficiaire_nom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificats de Calibration (CDC §7.2 Section 11) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Certificats'))?.num}. Certificats de Calibration
        </h2>

        <div className="space-y-6">
          <p className="text-sm">
            Les mesures de débit ont été réalisées avec un appareil de mesure <strong>TA-SCOPE</strong>
            dont les certificats de calibration sont présentés ci-dessous.
          </p>

          {/* Placeholder pour certificats - images à ajouter dans /public/templates/ */}
          <div className="grid grid-cols-1 gap-4">
            <div className="border rounded-lg p-4 text-center bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/certificat-tascope-1.png"
                alt="Certificat calibration TA-SCOPE page 1"
                className="mx-auto max-w-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="py-12 text-muted-foreground text-sm">
                      <p class="font-medium">Certificat de calibration TA-SCOPE</p>
                      <p class="text-xs mt-2">Image à ajouter dans /public/templates/certificat-tascope-1.png</p>
                    </div>
                  `
                }}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-4">
            <p className="font-medium mb-2">Informations sur l&apos;appareil de mesure :</p>
            <ul className="space-y-1">
              <li>• Marque : IMI Hydronic Engineering</li>
              <li>• Modèle : TA-SCOPE</li>
              <li>• Type : Débitmètre à ultrasons</li>
              <li>• Précision : ±2% de la valeur mesurée</li>
              <li>• Dernière calibration : Voir certificat ci-dessus</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer sur chaque page pour impression */}
      <style jsx global>{`
        @media print {
          .page-a4 {
            position: relative;
          }
          .page-a4::after {
            content: "${PLUG2DRIVE.nom} - ${rapport.numero_dossier || ''} - Confidentiel";
            position: absolute;
            bottom: 10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #999;
          }
        }
      `}</style>
    </div>
  )
}
