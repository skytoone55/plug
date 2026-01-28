'use client'

import type { RapportDesembouage } from '@/lib/types'
import { PLUG2DRIVE, PRODUITS_DEFAUT, FICHES_CEE } from '@/lib/constants/plug2drive'

interface DesembouageReportProps {
  rapport: RapportDesembouage
}

export default function DesembouageReport({ rapport }: DesembouageReportProps) {
  // Build dynamic table of contents (CDC §7.1)
  const sections: { num: number; title: string }[] = []
  let sectionNum = 1

  sections.push({ num: sectionNum++, title: 'Page de garde' })
  sections.push({ num: sectionNum++, title: 'Note technique' })
  sections.push({ num: sectionNum++, title: 'Rapport d\'intervention' })
  sections.push({ num: sectionNum++, title: 'Galerie photos' })
  sections.push({ num: sectionNum++, title: 'Annexe - Fiche technique produit' })
  sections.push({ num: sectionNum++, title: 'Annexe - Fiche de données de sécurité' })
  sections.push({ num: sectionNum++, title: 'Signatures et validation' })

  // Vérification conformité pH
  const phConforme = rapport.ph_apres_traitement != null && rapport.ph_avant_traitement != null
    ? rapport.ph_apres_traitement < rapport.ph_avant_traitement
    : null

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

      {/* PAGE 1: Cover (CDC §7.1 Section 1) */}
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
          <h1 className="text-3xl font-bold text-primary mb-2">RAPPORT DE DÉSEMBOUAGE</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Fiche CEE : {FICHES_CEE.DESEMBOUAGE}
          </p>

          {rapport.numero_dossier && (
            <p className="text-sm font-medium mb-4">N° Dossier : {rapport.numero_dossier}</p>
          )}

          {/* Vue aérienne (CDC obligatoire) */}
          {rapport.vue_aerienne && (
            <div className="mx-auto mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rapport.vue_aerienne}
                alt="Vue aérienne du site"
                className="max-h-48 object-contain rounded-lg border shadow-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Vue aérienne du site</p>
            </div>
          )}

          <div className="text-lg space-y-1">
            <p className="font-semibold text-foreground">{rapport.site_adresse}</p>
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

      {/* PAGE 3: Note Technique (CDC §7.1 Section 2) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Note technique'))?.num}. Note Technique
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

        {/* Informations générales */}
        <div className="grid grid-cols-2 gap-6 mb-8">
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
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Site d&apos;intervention</h3>
            <div className="space-y-1 text-sm">
              <p>{rapport.site_adresse}</p>
              <p>{rapport.site_code_postal} {rapport.site_ville}</p>
              {rapport.reference_cadastrale && <p>Réf. cadastrale : {rapport.reference_cadastrale}</p>}
              <p>Bâtiments : {rapport.site_nb_batiments || '-'}</p>
              <p>Appartements : {rapport.site_nb_appartements || '-'}</p>
              {rapport.zone_climatique && <p>Zone climatique : {rapport.zone_climatique}</p>}
            </div>
          </div>
        </div>

        {/* Contact Gardien */}
        {(rapport.gardien_nom || rapport.gardien_tel) && (
          <div className="mb-6 border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Contact Gardien</h3>
            <p className="text-sm">{rapport.gardien_nom} {rapport.gardien_tel && `- ${rapport.gardien_tel}`}</p>
          </div>
        )}

        {/* Caractéristiques du site */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Caractéristiques du site</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30 w-1/2">Nombre d&apos;appartements</td>
                <td className="py-2 px-4">{rapport.site_nb_appartements || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Nombre de bâtiments</td>
                <td className="py-2 px-4">{rapport.site_nb_batiments || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Nombre d&apos;émetteurs (calculé)</td>
                <td className="py-2 px-4">{rapport.nb_emetteurs || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Volume d&apos;eau estimatif</td>
                <td className="py-2 px-4">{rapport.volume_eau_estimatif ? `${rapport.volume_eau_estimatif} L` : '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Volume total circuit</td>
                <td className="py-2 px-4">{rapport.volume_total_eau ? `${rapport.volume_total_eau} L` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Installation chauffage */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Installation de chauffage</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30 w-1/2">Type d&apos;installation</td>
                <td className="py-2 px-4">{rapport.type_installation || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Type de réseau</td>
                <td className="py-2 px-4">{rapport.type_reseau || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Nature du réseau</td>
                <td className="py-2 px-4">{rapport.nature_reseau || '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Puissance nominale</td>
                <td className="py-2 px-4">{rapport.puissance_nominale_kw ? `${rapport.puissance_nominale_kw} kW` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 4: Rapport d'intervention (CDC §7.1 Section 3) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Rapport d\'intervention'))?.num}. Rapport d&apos;intervention
        </h2>

        {/* Produits utilisés (CDC §5.2 Section 5) */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Produits utilisés</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30 w-1/2">Réactif désembouant</td>
                <td className="py-2 px-4">{rapport.reactif_desembouant || PRODUITS_DEFAUT.reactif_desembouant}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Réactif inhibiteur</td>
                <td className="py-2 px-4">{rapport.reactif_inhibiteur || PRODUITS_DEFAUT.reactif_inhibiteur}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Référence pompe</td>
                <td className="py-2 px-4">{rapport.reference_pompe || PRODUITS_DEFAUT.reference_pompe}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Taux de dilution</td>
                <td className="py-2 px-4">{rapport.taux_dilution || PRODUITS_DEFAUT.taux_dilution}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Traitement (CDC §5.2 Section 6) */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Traitement effectué</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30 w-1/2">Quantité désembouant</td>
                <td className="py-2 px-4">{rapport.quantite_desembouant_l ? `${rapport.quantite_desembouant_l} L` : '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Durée de traitement</td>
                <td className="py-2 px-4">{rapport.duree_traitement_jours ? `${rapport.duree_traitement_jours} jours` : '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Date de rinçage</td>
                <td className="py-2 px-4">{rapport.date_rincage || '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Quantité inhibiteur</td>
                <td className="py-2 px-4">{rapport.quantite_inhibiteur_l ? `${rapport.quantite_inhibiteur_l} L` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Analyse eau (CDC §5.2 Section 7) */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Analyse de l&apos;eau</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-4 text-left"></th>
                <th className="py-2 px-4 text-left">Avant traitement</th>
                <th className="py-2 px-4 text-left">Après traitement</th>
                <th className="py-2 px-4 text-left">Conformité</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium">pH</td>
                <td className="py-2 px-4">{rapport.ph_avant_traitement ?? rapport.ph_avant ?? '-'}</td>
                <td className="py-2 px-4">{rapport.ph_apres_traitement ?? rapport.ph_apres ?? '-'}</td>
                <td className="py-2 px-4">
                  {phConforme !== null && (
                    <span className={phConforme ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {phConforme ? '✓ Conforme' : '✗ Non conforme'}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium">Température (°C)</td>
                <td className="py-2 px-4">{rapport.temperature_avant ?? '-'}</td>
                <td className="py-2 px-4">{rapport.temperature_apres ?? '-'}</td>
                <td className="py-2 px-4">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {phConforme === false && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm text-red-800 dark:text-red-300">
            <strong>Attention :</strong> Le pH après traitement doit être inférieur au pH avant traitement
            pour valider l&apos;efficacité du désembouage.
          </div>
        )}

        {phConforme === true && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm text-green-800 dark:text-green-300">
            <strong>Validation :</strong> Le traitement de désembouage a été efficace.
            La baisse du pH témoigne de l&apos;élimination des dépôts et embouages du circuit.
          </div>
        )}
      </div>

      {/* PAGE 5: Galerie photos (CDC §7.1 Section 4) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Galerie photos'))?.num}. Galerie photos
        </h2>

        {/* Vue aérienne */}
        {rapport.vue_aerienne && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Vue aérienne</h3>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rapport.vue_aerienne} alt="Vue aérienne" className="rounded-lg object-cover max-h-40" />
            </div>
          </div>
        )}

        {/* Photo chaudière */}
        {rapport.photo_chaudiere && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Photo chaudière</h3>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rapport.photo_chaudiere} alt="Chaudière" className="rounded-lg object-cover max-h-40" />
            </div>
          </div>
        )}

        {/* Photos produits */}
        {rapport.photos_produits && rapport.photos_produits.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Produits utilisés</h3>
            <div className="grid grid-cols-3 gap-3">
              {rapport.photos_produits.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={url} alt={`Produit ${i + 1}`} className="rounded-lg object-cover w-full max-h-32" />
              ))}
            </div>
          </div>
        )}

        {/* Photos bâtiments */}
        {rapport.photos_batiments && rapport.photos_batiments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Bâtiments</h3>
            <div className="grid grid-cols-2 gap-3">
              {rapport.photos_batiments.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={url} alt={`Bâtiment ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
              ))}
            </div>
          </div>
        )}

        {/* Photos boues */}
        {rapport.photos_boues && rapport.photos_boues.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Photos des boues extraites</h3>
            <div className="grid grid-cols-2 gap-3">
              {rapport.photos_boues.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={url} alt={`Boues ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
              ))}
            </div>
          </div>
        )}

        {/* Photos filtre/pot à boues */}
        {rapport.photos_filtre_pot_boues && rapport.photos_filtre_pot_boues.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">Filtre / Pot à boues</h3>
            <div className="grid grid-cols-2 gap-3">
              {rapport.photos_filtre_pot_boues.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={url} alt={`Filtre ${i + 1}`} className="rounded-lg object-cover w-full max-h-40" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PAGE 6: Annexe - Fiche technique produit (CDC §7.1 Section 5) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Fiche technique'))?.num}. Annexe - Fiche technique produit
        </h2>

        <div className="space-y-6">
          <p className="text-sm">
            Le traitement a été réalisé avec le produit <strong>{rapport.reactif_desembouant || PRODUITS_DEFAUT.reactif_desembouant}</strong>.
            La fiche technique du produit est présentée ci-dessous.
          </p>

          {/* Placeholder pour fiche technique */}
          <div className="border rounded-lg p-4 text-center bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/fiche-aquatherm-1200.png"
              alt="Fiche technique AQUA-THERM 1200"
              className="mx-auto max-w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                  <div class="py-12 text-muted-foreground text-sm">
                    <p class="font-medium">Fiche technique ${PRODUITS_DEFAUT.reactif_desembouant}</p>
                    <p class="text-xs mt-2">Document à joindre : /public/templates/fiche-aquatherm-1200.png</p>
                  </div>
                `
              }}
            />
          </div>

          {rapport.document_fabricant && (
            <div className="text-sm">
              <p><strong>Document fabricant joint :</strong> {rapport.document_fabricant}</p>
            </div>
          )}
        </div>
      </div>

      {/* PAGE 7: Annexe - FDS (CDC §7.1 Section 6) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Fiche de données de sécurité'))?.num}. Annexe - Fiche de données de sécurité
        </h2>

        <div className="space-y-6">
          <p className="text-sm">
            Conformément à la réglementation, la fiche de données de sécurité (FDS) du produit utilisé
            est jointe en annexe.
          </p>

          {/* Placeholder pour FDS */}
          <div className="border rounded-lg p-4 text-center bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/fds-aquatherm-1200.png"
              alt="FDS AQUA-THERM 1200"
              className="mx-auto max-w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                  <div class="py-12 text-muted-foreground text-sm">
                    <p class="font-medium">Fiche de Données de Sécurité</p>
                    <p class="text-xs mt-2">Document à joindre : /public/templates/fds-aquatherm-1200.png</p>
                  </div>
                `
              }}
            />
          </div>
        </div>
      </div>

      {/* PAGE 8: Signatures (CDC §7.1 Section 7) */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">
          {sections.find(s => s.title.includes('Signatures'))?.num}. Signatures et validation
        </h2>

        {/* Résumé */}
        <div className="mb-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Résumé de l&apos;intervention</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Date d&apos;intervention :</strong> {rapport.technicien_date_intervention || '-'}</p>
              <p><strong>Durée traitement :</strong> {rapport.duree_traitement_jours ? `${rapport.duree_traitement_jours} jours` : '-'}</p>
              <p><strong>Date de rinçage :</strong> {rapport.date_rincage || '-'}</p>
            </div>
            <div>
              <p><strong>Volume traité :</strong> {rapport.volume_total_eau ? `${rapport.volume_total_eau} L` : '-'}</p>
              <p><strong>Produit utilisé :</strong> {rapport.reactif_desembouant || PRODUITS_DEFAUT.reactif_desembouant}</p>
              <p><strong>Résultat pH :</strong>{' '}
                {phConforme !== null ? (
                  <span className={phConforme ? 'text-green-600' : 'text-red-600'}>
                    {phConforme ? 'Conforme' : 'Non conforme'}
                  </span>
                ) : '-'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm mb-8">
          Je soussigné(e), certifie que l&apos;ensemble des opérations de désembouage a été réalisé
          conformément aux règles de l&apos;art, aux normes en vigueur et aux exigences de la
          fiche CEE <strong>{FICHES_CEE.DESEMBOUAGE}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-8">
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

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <p>{rapport.prestataire_nom || PLUG2DRIVE.nom}</p>
          <p>{rapport.prestataire_adresse || PLUG2DRIVE.adresse} {rapport.prestataire_code_postal || PLUG2DRIVE.code_postal} {rapport.prestataire_ville || PLUG2DRIVE.ville}</p>
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
