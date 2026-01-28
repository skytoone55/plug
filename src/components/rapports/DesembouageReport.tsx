'use client'

import type { RapportDesembouage } from '@/lib/types'

interface DesembouageReportProps {
  rapport: RapportDesembouage
}

export default function DesembouageReport({ rapport }: DesembouageReportProps) {
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
        <h1 className="text-3xl font-bold text-primary mb-4">RAPPORT DE DÉSEMBOUAGE</h1>
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

      {/* PAGE 2: Photos - Produits & Vue aérienne */}
      {((rapport.photos_produits && rapport.photos_produits.length > 0) ||
        (rapport.photos_vue_aerienne && rapport.photos_vue_aerienne.length > 0) ||
        (rapport.photos_batiments && rapport.photos_batiments.length > 0)) && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-6 text-primary">Photos de l&apos;installation</h2>

          {rapport.photos_produits && rapport.photos_produits.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Produits utilisés</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_produits.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Produit ${i + 1}`} className="rounded-lg object-cover w-full" />
                ))}
              </div>
            </div>
          )}

          {rapport.photos_vue_aerienne && rapport.photos_vue_aerienne.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">Vue aérienne</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_vue_aerienne.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Vue aérienne ${i + 1}`} className="rounded-lg object-cover w-full" />
                ))}
              </div>
            </div>
          )}

          {rapport.photos_batiments && rapport.photos_batiments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Bâtiments</h3>
              <div className="grid grid-cols-2 gap-3">
                {rapport.photos_batiments.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`Bâtiment ${i + 1}`} className="rounded-lg object-cover w-full" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAGE 3: Note Technique & Résultats */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-6 text-primary">Note Technique</h2>

        {/* Informations générales */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Bénéficiaire</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{rapport.beneficiaire_nom}</p>
              <p>{rapport.beneficiaire_adresse}</p>
              <p>{rapport.beneficiaire_code_postal} {rapport.beneficiaire_ville}</p>
              <p>{rapport.beneficiaire_telephone}</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Site</h3>
            <div className="space-y-1 text-sm">
              <p>{rapport.site_adresse}</p>
              <p>{rapport.site_code_postal} {rapport.site_ville}</p>
              <p>Bâtiments : {rapport.site_nb_batiments || '-'}</p>
              <p>Appartements : {rapport.site_nb_appartements || '-'}</p>
            </div>
          </div>
        </div>

        {/* Données techniques */}
        <div className="border rounded-lg overflow-hidden mb-8">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Caractéristiques de l&apos;installation</h3>
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
                <td className="py-2 px-4 font-medium bg-muted/30">Nombre d&apos;émetteurs</td>
                <td className="py-2 px-4">{rapport.nb_emetteurs || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Volume d&apos;eau estimatif</td>
                <td className="py-2 px-4">{rapport.volume_eau_estimatif ? `${rapport.volume_eau_estimatif} L` : '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Volume total d&apos;eau du circuit</td>
                <td className="py-2 px-4">{rapport.volume_total_eau ? `${rapport.volume_total_eau} L` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Produits */}
        <div className="border rounded-lg overflow-hidden mb-8">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Produits utilisés</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30 w-1/2">Réactif désembouant</td>
                <td className="py-2 px-4">
                  {rapport.reac_desembouant_nom || '-'}
                  {rapport.reac_desembouant_qte ? ` — ${rapport.reac_desembouant_qte} L` : ''}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium bg-muted/30">Durée de traitement</td>
                <td className="py-2 px-4">{rapport.reac_desembouant_duree || '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium bg-muted/30">Inhibiteur de corrosion</td>
                <td className="py-2 px-4">
                  {rapport.produit_inhibiteur_nom || '-'}
                  {rapport.produit_inhibiteur_qte ? ` — ${rapport.produit_inhibiteur_qte} L` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultats */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/10 px-4 py-2">
            <h3 className="font-semibold text-sm">Résultats des mesures</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-4 text-left"></th>
                <th className="py-2 px-4 text-left">Avant traitement</th>
                <th className="py-2 px-4 text-left">Après traitement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-medium">pH</td>
                <td className="py-2 px-4">{rapport.ph_avant || '-'}</td>
                <td className="py-2 px-4">{rapport.ph_apres || '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium">Température (°C)</td>
                <td className="py-2 px-4">{rapport.temperature_avant || '-'}</td>
                <td className="py-2 px-4">{rapport.temperature_apres || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pages Justificatives - Photos boues */}
      {rapport.photos_boues && rapport.photos_boues.length > 0 && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-6 text-primary">Pièces Justificatives - Photos des boues</h2>
          <div className="grid grid-cols-2 gap-4">
            {rapport.photos_boues.map((url, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={i} src={url} alt={`Boues ${i + 1}`} className="rounded-lg object-cover w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Pages Justificatives - Autres */}
      {rapport.photos_justificatifs && rapport.photos_justificatifs.length > 0 && (
        <div className="page-a4">
          <h2 className="text-xl font-bold mb-6 text-primary">Pièces Justificatives</h2>
          <div className="grid grid-cols-2 gap-4">
            {rapport.photos_justificatifs.map((url, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={i} src={url} alt={`Justificatif ${i + 1}`} className="rounded-lg object-cover w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Signature Page */}
      <div className="page-a4">
        <h2 className="text-xl font-bold mb-8 text-primary">Signatures</h2>

        <p className="text-sm mb-8">
          Je soussigné(e), certifie que l&apos;ensemble des opérations de désembouage a été réalisé
          conformément aux règles de l&apos;art et aux normes en vigueur.
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

        <div className="mt-16 text-center text-xs text-muted-foreground">
          <p>Date : {rapport.technicien_date_intervention || '-'}</p>
          <p className="mt-2">{rapport.prestataire_nom} — {rapport.prestataire_adresse} {rapport.prestataire_code_postal} {rapport.prestataire_ville}</p>
        </div>
      </div>
    </div>
  )
}
