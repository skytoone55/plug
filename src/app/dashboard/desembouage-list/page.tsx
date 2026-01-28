import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Droplets, Eye, Pencil } from 'lucide-react'
import DeleteRapportButton from '@/components/dashboard/DeleteRapportButton'

export default async function DesembouageListPage() {
  const { data: rapports } = await supabaseAdmin
    .from('rapports_desembouage')
    .select('*')
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
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Bénéficiaire</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Site</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Appartements</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Volume total</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports && rapports.length > 0 ? (
              rapports.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm">
                    {r.technicien_date_intervention || new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{r.beneficiaire_nom || '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {r.site_adresse ? `${r.site_adresse}, ${r.site_ville || ''}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">{r.site_nb_appartements || '-'}</td>
                  <td className="py-3 px-4 text-sm">{r.volume_total_eau ? `${r.volume_total_eau} L` : '-'}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
