'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Droplets,
  Plus,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

interface Client {
  id: string
  nom: string
  type: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  contact_nom: string | null
  contact_tel: string | null
  notes: string | null
  created_at: string
}

interface Chantier {
  id: string
  nom: string
  adresse: string | null
  ville: string | null
  type_travaux: string[] | null
  statut: string | null
  nb_appartements: number | null
  created_at: string
}

const typeClientLabels: Record<string, { label: string; color: string }> = {
  syndic: { label: 'Syndic', color: 'bg-blue-500' },
  bailleur: { label: 'Bailleur', color: 'bg-purple-500' },
  copropriete: { label: 'Copropriété', color: 'bg-green-500' },
  particulier: { label: 'Particulier', color: 'bg-orange-500' },
}

const statutChantierConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_attente: { label: 'En attente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  annule: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return

      const clientsRes = await fetch('/api/clients')
      const clientsData = await clientsRes.json()
      const clientData = Array.isArray(clientsData)
        ? clientsData.find((c: Client) => c.id === params.id)
        : null
      setClient(clientData)

      const chantiersRes = await fetch(`/api/chantiers?client_id=${params.id}`)
      const chantiersData = await chantiersRes.json()
      setChantiers(Array.isArray(chantiersData) ? chantiersData : [])

      setLoading(false)
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!client) {
    return (
      <div className="p-6">
        <p>Client non trouvé</p>
        <Link href="/dashboard/clients" className="text-primary hover:underline">
          Retour aux clients
        </Link>
      </div>
    )
  }

  const typeConfig = typeClientLabels[client.type || ''] || {
    label: 'Client',
    color: 'bg-gray-500',
  }

  // Stats
  const chantiersEnCours = chantiers.filter(c => c.statut === 'en_cours').length
  const chantiersTermines = chantiers.filter(c => c.statut === 'termine').length
  const totalLots = chantiers.reduce((sum, c) => sum + (c.nb_appartements || 0), 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header avec infos client en HORIZONTAL */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white shadow-lg">
        {/* Ligne 1: Retour + Nom + Type + Bouton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/clients')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">{client.nom}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          </div>
          <Link
            href={`/dashboard/chantiers?client_id=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouveau chantier
          </Link>
        </div>

        {/* Ligne 2: Toutes les infos client en horizontal */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-white/20">
          {/* Email */}
          {client.email && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Email</p>
              <a href={`mailto:${client.email}`} className="text-sm hover:underline truncate block">
                {client.email}
              </a>
            </div>
          )}

          {/* Téléphone */}
          {client.telephone && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Téléphone</p>
              <a href={`tel:${client.telephone}`} className="text-sm font-medium hover:underline">
                {client.telephone}
              </a>
            </div>
          )}

          {/* Adresse */}
          {client.ville && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Ville</p>
              <p className="text-sm">{client.code_postal} {client.ville}</p>
            </div>
          )}

          {/* Contact */}
          {client.contact_nom && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Contact</p>
              <p className="text-sm">{client.contact_nom}</p>
              {client.contact_tel && (
                <a href={`tel:${client.contact_tel}`} className="text-xs text-slate-300 hover:underline">
                  {client.contact_tel}
                </a>
              )}
            </div>
          )}

          {/* Client depuis */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Client depuis</p>
            <p className="text-sm">{new Date(client.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Ligne 3: Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold">{chantiers.length}</div>
            <div className="text-slate-300 text-xs uppercase tracking-wide">Chantiers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300">{chantiersEnCours}</div>
            <div className="text-slate-300 text-xs uppercase tracking-wide">En cours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{chantiersTermines}</div>
            <div className="text-slate-300 text-xs uppercase tracking-wide">Terminés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalLots}</div>
            <div className="text-slate-300 text-xs uppercase tracking-wide">Total lots</div>
          </div>
        </div>

        {/* Notes si présentes */}
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-slate-200">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Liste des chantiers - PLEINE LARGEUR */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Chantiers</h2>
            <span className="text-sm text-muted-foreground">({chantiers.length})</span>
          </div>
        </div>

        {chantiers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-sm">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Site</th>
                  <th className="text-left px-4 py-3 font-medium">Adresse</th>
                  <th className="text-center px-4 py-3 font-medium">Lots</th>
                  <th className="text-left px-4 py-3 font-medium">Travaux</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-center px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chantiers.map((chantier) => {
                  const statut = statutChantierConfig[chantier.statut || 'en_attente']
                  const StatutIcon = statut.icon
                  return (
                    <tr key={chantier.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{chantier.nom}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {chantier.adresse && `${chantier.adresse}, `}{chantier.ville}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {chantier.nb_appartements || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {chantier.type_travaux?.map((type) => (
                            <span
                              key={type}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                type === 'equilibrage'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {type === 'equilibrage' ? (
                                <FileText className="w-3 h-3" />
                              ) : (
                                <Droplets className="w-3 h-3" />
                              )}
                              {type === 'equilibrage' ? 'Éq.' : 'Dés.'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statut.color}`}>
                          <StatutIcon className="w-3 h-3" />
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/chantiers/${chantier.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Aucun chantier</p>
            <p className="text-sm mt-1">Ce client n&apos;a pas encore de chantier</p>
            <Link
              href="/dashboard/chantiers"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Créer un chantier
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
