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
  AlertTriangle,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClientFinal {
  nom: string
}

interface ChantierInfo {
  nom: string
  adresse: string | null
  ville: string | null
  nb_appartements: number | null
  clients_finaux?: ClientFinal | null
}

interface Rapport {
  id: string
  numero_dossier: string | null
  statut: string | null
  reclamation_note: string | null
  created_at: string
  chantier_id: string | null
  type: 'equilibrage' | 'desembouage'
  chantiers?: ChantierInfo | null
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_preparation: { label: 'En préparation', color: 'bg-slate-100 text-slate-700', icon: Clock },
  pret: { label: 'Prêt', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  livre: { label: 'Livré', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  conteste: { label: 'Contesté', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function MesRapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'equilibrage' | 'desembouage'>('all')
  const [filterStatut, setFilterStatut] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Récupérer les rapports d'équilibrage
      const { data: eqData } = await supabase
        .from('rapports_equilibrage')
        .select(`
          id, numero_dossier, statut, reclamation_note, created_at, chantier_id,
          chantiers (
            nom, adresse, ville, nb_appartements,
            clients_finaux (nom)
          )
        `)
        .order('created_at', { ascending: false })

      // Récupérer les rapports de désembouage
      const { data: desData } = await supabase
        .from('rapports_desembouage')
        .select(`
          id, numero_dossier, statut, reclamation_note, created_at, chantier_id,
          chantiers (
            nom, adresse, ville, nb_appartements,
            clients_finaux (nom)
          )
        `)
        .order('created_at', { ascending: false })

      // Normaliser les données (Supabase peut retourner un array ou un objet pour les relations)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizeRapport = (r: any, type: 'equilibrage' | 'desembouage'): Rapport => {
        const chantierRaw = Array.isArray(r.chantiers) ? r.chantiers[0] : r.chantiers
        let chantierData: ChantierInfo | null = null

        if (chantierRaw) {
          const clientFinal = Array.isArray(chantierRaw.clients_finaux)
            ? chantierRaw.clients_finaux[0]
            : chantierRaw.clients_finaux
          chantierData = {
            nom: chantierRaw.nom,
            adresse: chantierRaw.adresse,
            ville: chantierRaw.ville,
            nb_appartements: chantierRaw.nb_appartements,
            clients_finaux: clientFinal || null
          }
        }

        return {
          id: r.id,
          numero_dossier: r.numero_dossier,
          statut: r.statut,
          reclamation_note: r.reclamation_note,
          created_at: r.created_at,
          chantier_id: r.chantier_id,
          type,
          chantiers: chantierData
        }
      }

      const allRapports: Rapport[] = [
        ...(eqData || []).map(r => normalizeRapport(r, 'equilibrage')),
        ...(desData || []).map(r => normalizeRapport(r, 'desembouage')),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setRapports(allRapports)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filtrer les rapports
  const filteredRapports = rapports.filter(rapport => {
    if (filterType !== 'all' && rapport.type !== filterType) return false
    if (filterStatut !== 'all' && rapport.statut !== filterStatut) return false
    if (search) {
      const searchLower = search.toLowerCase()
      const siteName = rapport.chantiers?.nom?.toLowerCase() || ''
      const clientName = rapport.chantiers?.clients_finaux?.nom?.toLowerCase() || ''
      const numero = rapport.numero_dossier?.toLowerCase() || ''
      if (!siteName.includes(searchLower) && !clientName.includes(searchLower) && !numero.includes(searchLower)) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Rapports</h1>
        <div className="text-sm text-muted-foreground">
          {rapports.length} rapport(s) au total
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par site, client, n° dossier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'equilibrage' | 'desembouage')}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="all">Tous les types</option>
          <option value="equilibrage">Équilibrage</option>
          <option value="desembouage">Désembouage</option>
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_preparation">En préparation</option>
          <option value="pret">Prêt</option>
          <option value="livre">Livré</option>
          <option value="conteste">Contesté</option>
        </select>
      </div>

      {/* Liste des rapports */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Site</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Lots</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRapports.length > 0 ? (
              filteredRapports.map((rapport) => {
                const statut = statutConfig[rapport.statut || 'en_preparation']
                const StatutIcon = statut.icon
                const isEquilibrage = rapport.type === 'equilibrage'

                return (
                  <tr key={`${rapport.type}-${rapport.id}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {new Date(rapport.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                        isEquilibrage ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isEquilibrage ? <FileText className="w-3 h-3" /> : <Droplets className="w-3 h-3" />}
                        {isEquilibrage ? 'Éq.' : 'Dés.'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{rapport.chantiers?.nom || '-'}</span>
                      </div>
                      {rapport.chantiers?.adresse && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rapport.chantiers.adresse}, {rapport.chantiers.ville}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {rapport.chantiers?.clients_finaux?.nom || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {rapport.chantiers?.nb_appartements || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                        <StatutIcon className="w-3 h-3" />
                        {statut.label}
                      </span>
                      {rapport.statut === 'conteste' && rapport.reclamation_note && (
                        <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={rapport.reclamation_note}>
                          {rapport.reclamation_note}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/${isEquilibrage ? 'rapport-view' : 'desembouage-view'}/${rapport.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Voir le rapport"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">Aucun rapport trouvé</p>
                  {search && <p className="text-sm mt-1">Essayez de modifier votre recherche</p>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
