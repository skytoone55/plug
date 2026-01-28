'use client'

import type { RapportEquilibrage, MesureDebit, MesureTemperature } from '@/lib/types'
import { calculerEcartTemperature } from '@/lib/formulas'
import SynoptiqueHydraulique from './SynoptiqueHydraulique'

interface EquilibrageReportProps {
  rapport: RapportEquilibrage
}

export default function EquilibrageReport({ rapport }: EquilibrageReportProps) {
  const hasChaufferie = !!(rapport.commentaire_chaufferie || (rapport.photos_chaufferie && rapport.photos_chaufferie.length > 0))

  // Build dynamic table of contents
  const sections: { num: number; title: string }[] = []
  let sectionNum = 1

  sections.push({ num: sectionNum++, title: 'Description générale de l\'installation' })
  sections.push({ num: sectionNum++, title: 'Méthodologie de l\'équilibrage' })
  sections.push({ num: sectionNum++, title: 'Tableau d\'Équilibrage' })

  if (hasChaufferie) {
    sections.push({ num: sectionNum++, title: 'Installation et Réseaux' })
  }

  sections.push({ num: sectionNum++, title: 'Relevé de Températures' })
  sections.push({ num: sectionNum++, title: 'Synoptique Hydraulique Simplifié' })
  sections.push({ num: sectionNum++, title: 'Photos' })
  sections.push({ num: sectionNum++, title: 'Conclusion' })

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

      {/* PAGE 1: Cover */}
      <div className="page-a4 flex flex-col items-center justify-center text-center">
        {rapport.prestataire_logo_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={rapport.prestataire_logo_url} alt="Logo" className="h-24 mb-8 object-contain" />
        )}
        <h1 className="text-3xl font-bold text-primary mb-4">RAPPORT D&apos;ÉQUILIBRAGE</h1>
        <div className="text-lg text-muted-foreground space-y-2 mt-6">
          <p className="font-semibold text-foreground">{rapport.site_adresse}</p>
          <p>{rapport.site_code_postal} {rapport.site_ville}</p>
          <p className="mt-6 text-sm">
            Date d&apos;intervention : {rapport.technicien_date_intervention || '-'}
          </p>
        </div>
        <div className="mt-auto text-sm text-muted-foreground">
          <p>{rapport.prestataire_nom}</p>
          <p>{rapport.prestataire_adresse} {rapport.prestataire_code_postal} {rapport.prestataire_ville}</p>
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

      {/* PAGE 3: General Information */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">Informations Générales</h2>
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
            </div>
          </div>
          {/* Site */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Site d&apos;intervention</h3>
            <div className="space-y-1 text-sm">
              <p>{rapport.site_adresse}</p>
              <p>{rapport.site_code_postal} {rapport.site_ville}</p>
              <p>Réf. cadastrale : {rapport.site_ref_cadastrale || '-'}</p>
              <p>Bâtiments : {rapport.site_nb_batiments || '-'} | Niveaux : {rapport.site_nb_niveaux || '-'} | Lots : {rapport.site_nb_lots || '-'}</p>
            </div>
          </div>
          {/* Technicien */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Technicien</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{rapport.technicien_prenom} {rapport.technicien_nom}</p>
              <p>Date : {rapport.technicien_date_intervention || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Description'))?.num}. Description générale de l&apos;installation
        </h2>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {rapport.description_reseau || 'Aucune description.'}
        </div>

        <h2 className="text-xl font-bold mb-4 mt-8 text-primary">
          {sections.find(s => s.title.includes('Méthodologie'))?.num}. Méthodologie de l&apos;équilibrage
        </h2>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {rapport.methode_equilibrage || 'Aucune méthodologie.'}
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

      {/* Photos */}
      {((rapport.photos_equipement && rapport.photos_equipement.length > 0) ||
        (rapport.photos_intervention && rapport.photos_intervention.length > 0)) && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-4 text-primary">
            {sections.find(s => s.title.includes('Photos'))?.num}. Photos
          </h2>

          {rapport.photos_equipement && rapport.photos_equipement.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Photos Équipement</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_equipement.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Équipement ${i + 1}`} className="rounded-lg object-cover w-full" />
                ))}
              </div>
            </div>
          )}

          {rapport.photos_intervention && rapport.photos_intervention.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Photos Intervention</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_intervention.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Intervention ${i + 1}`} className="rounded-lg object-cover w-full" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          {sections.find(s => s.title.includes('Conclusion'))?.num}. Conclusion et Signatures
        </h2>

        <p className="text-sm mb-8">
          L&apos;ensemble des opérations d&apos;équilibrage a été réalisé conformément aux normes en vigueur.
          Les résultats des mesures sont consignés dans le présent rapport.
        </p>

        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <p className="font-medium mb-4">Signature du technicien</p>
            {rapport.signature_technicien && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={rapport.signature_technicien} alt="Signature technicien" className="mx-auto h-24" />
            )}
            <div className="border-t mt-4 pt-2 text-sm text-muted-foreground">
              {rapport.technicien_prenom} {rapport.technicien_nom}
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium mb-4">Signature du client</p>
            {rapport.signature_client && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={rapport.signature_client} alt="Signature client" className="mx-auto h-24" />
            )}
            <div className="border-t mt-4 pt-2 text-sm text-muted-foreground">
              Le bénéficiaire
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
