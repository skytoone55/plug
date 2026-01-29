import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Droplets, Eye, Pencil, MapPin, Building, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import DeleteRapportButton from '@/components/dashboard/DeleteRapportButton'

export const dynamic = 'force-dynamic'

const statutConfig: Record<string, { label: string; color: string; icon: string }> = {
  en_preparation: { label: 'En préparation', color: 'bg-slate-100 text-slate-700', icon: 'clock' },
  pret: { label: 'Prêt', color: 'bg-green-100 text-green-700', icon: 'check' },
  livre: { label: 'Livré', color: 'bg-blue-100 text-blue-700', icon: 'check' },
  conteste: { label: 'Contesté', color: 'bg-red-100 text-red-700', icon: 'alert' },
}

export default async function DesembouageListPage() {
  const { data: rapports } = await supabaseAdmin
    .from('rapports_desembouage')
    .select(`
      *,
      chantiers (
        id,
        nom,
        adresse,
        ville,
        nb_appartements,
        clients_finaux (
          id,
          nom
        )
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rapports de Désembouage</h1>
        <Link
          href="/dashboard/desembouage-create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau rapport
        </Link>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Site</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Adresse</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Lots</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Volume</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports && rapports.length > 0 ? (
              rapports.map((r) => {
                const statut = statutConfig[r.statut || 'en_preparation'] || statutConfig.en_preparation
                const chantier = r.chantiers
                const siteName = chantier?.nom || r.site_nom || r.beneficiaire_nom || '-'
                const siteAdresse = chantier
                  ? `${chantier.adresse || ''}, ${chantier.ville || ''}`.replace(/^, |, $/g, '')
                  : r.site_adresse
                    ? `${r.site_adresse}, ${r.site_ville || ''}`.replace(/^, |, $/g, '')
                    : '-'
                const nbLots = chantier?.nb_appartements || r.site_nb_appartements || '-'

                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {r.technicien_date_intervention || new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{siteName}</span>
                      </div>
                      {chantier?.clients_finaux && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {chantier.clients_finaux.nom}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {siteAdresse}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{nbLots}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">
                        {r.volume_total_eau ? `${r.volume_total_eau} L` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                        {statut.icon === 'clock' && <Clock className="w-3 h-3" />}
                        {statut.icon === 'check' && <CheckCircle className="w-3 h-3" />}
                        {statut.icon === 'alert' && <AlertTriangle className="w-3 h-3" />}
                        {statut.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/desembouage-view/${r.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Voir le rapport"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/desembouage-edit/${r.id}`}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DeleteRapportButton id={r.id} table="rapports_desembouage" />
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Droplets className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun rapport de désembouage</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
