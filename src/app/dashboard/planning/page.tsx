'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building,
  MapPin,
  FileText,
  Droplets,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClientInfo {
  nom: string
}

interface ChantierDB {
  id: string
  nom: string
  adresse: string | null
  ville: string | null
  type_travaux: string[] | null
  statut: string | null
  nb_appartements: number | null
  clients_finaux?: ClientInfo | ClientInfo[] | null
}

interface Chantier {
  id: string
  nom: string
  adresse: string | null
  ville: string | null
  type_travaux: string[] | null
  statut: string | null
  nb_appartements: number | null
  clients_finaux?: ClientInfo | null
}

const statutConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  en_attente: { label: 'En attente', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300', icon: Clock },
  termine: { label: 'Termine', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300', icon: CheckCircle },
  annule: { label: 'Annule', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300', icon: XCircle },
}

export default function PlanningPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: chantiersData } = await supabase
        .from('chantiers')
        .select('*, clients_finaux (nom)')
        .order('created_at', { ascending: false })

      if (chantiersData) {
        // Normaliser les données
        const normalizedChantiers: Chantier[] = (chantiersData as ChantierDB[]).map(c => ({
          ...c,
          clients_finaux: Array.isArray(c.clients_finaux) ? c.clients_finaux[0] : c.clients_finaux
        }))
        setChantiers(normalizedChantiers)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredChantiers = chantiers.filter(chantier => {
    if (filterStatut !== 'all' && chantier.statut !== filterStatut) return false
    return true
  })

  const stats = {
    total: chantiers.length,
    en_attente: chantiers.filter(c => c.statut === 'en_attente').length,
    en_cours: chantiers.filter(c => c.statut === 'en_cours').length,
    termine: chantiers.filter(c => c.statut === 'termine').length,
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planning General</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total chantiers</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <p className="text-sm text-orange-600">En attente</p>
          <p className="text-3xl font-bold text-orange-700">{stats.en_attente}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-sm text-blue-600">En cours</p>
          <p className="text-3xl font-bold text-blue-700">{stats.en_cours}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-600">Termines</p>
          <p className="text-3xl font-bold text-green-700">{stats.termine}</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Termine</option>
          <option value="annule">Annule</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Site</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Adresse</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Lots</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Travaux</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredChantiers.map((chantier) => {
              const statut = statutConfig[chantier.statut || 'en_attente']
              const StatutIcon = statut.icon
              return (
                <tr key={chantier.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{chantier.nom}</td>
                  <td className="py-3 px-4 text-sm">{chantier.clients_finaux?.nom || '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {chantier.adresse && chantier.adresse + ', '}{chantier.ville}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">{chantier.nb_appartements || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {chantier.type_travaux?.map((t) => (
                        <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-medium ${t === 'equilibrage' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {t === 'equilibrage' ? 'Eq.' : 'Des.'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statut.bgColor} ${statut.color}`}>
                      <StatutIcon className="w-3 h-3" />
                      {statut.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/dashboard/chantiers/${chantier.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded inline-block">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
