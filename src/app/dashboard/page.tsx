import { supabaseAdmin } from '@/lib/supabase/admin'
import { FileText, Droplets, Users, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Fetch counts
  const [equilibrageRes, desembouageRes, usersRes] = await Promise.all([
    supabase.from('rapports_equilibrage').select('id', { count: 'exact', head: true }),
    supabase.from('rapports_desembouage').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Rapports Équilibrage',
      value: equilibrageRes.count || 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Rapports Désembouage',
      value: desembouageRes.count || 0,
      icon: Droplets,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Utilisateurs',
      value: usersRes.count || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Total Rapports',
      value: (equilibrageRes.count || 0) + (desembouageRes.count || 0),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  // Fetch recent reports
  const { data: recentEquilibrage } = await supabase
    .from('rapports_equilibrage')
    .select('id, beneficiaire_nom, site_adresse, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentDesembouage } = await supabase
    .from('rapports_desembouage')
    .select('id, beneficiaire_nom, site_adresse, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Equilibrage */}
        <div className="bg-card rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Derniers rapports d&apos;équilibrage
            </h2>
          </div>
          <div className="p-4">
            {recentEquilibrage && recentEquilibrage.length > 0 ? (
              <div className="space-y-3">
                {recentEquilibrage.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{r.beneficiaire_nom || 'Sans nom'}</p>
                      <p className="text-xs text-muted-foreground">{r.site_adresse || '-'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun rapport</p>
            )}
          </div>
        </div>

        {/* Recent Desembouage */}
        <div className="bg-card rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Droplets className="w-4 h-4 text-emerald-600" />
              Derniers rapports de désembouage
            </h2>
          </div>
          <div className="p-4">
            {recentDesembouage && recentDesembouage.length > 0 ? (
              <div className="space-y-3">
                {recentDesembouage.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{r.beneficiaire_nom || 'Sans nom'}</p>
                      <p className="text-xs text-muted-foreground">{r.site_adresse || '-'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun rapport</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
