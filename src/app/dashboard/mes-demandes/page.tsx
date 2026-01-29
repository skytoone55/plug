'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Intervention {
  id: string
  numero_dossier: string | null
  type: 'equilibrage' | 'desembouage' | 'maintenance'
  statut: string
  priorite: string
  date_demande: string | null
  date_planifiee: string | null
  commentaire_installateur: string | null
  commentaire_admin: string | null
  chantiers?: {
    nom: string
    adresse: string | null
    ville: string | null
    clients_finaux?: { nom: string }
  }
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  demande: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  planifiee: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  facturee: { label: 'Facturée', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  payee: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

const typeLabels: Record<string, string> = {
  equilibrage: 'Équilibrage',
  desembouage: 'Désembouage',
  maintenance: 'Maintenance',
}

const prioriteColors: Record<string, string> = {
  basse: 'bg-gray-100 text-gray-600',
  normale: 'bg-blue-100 text-blue-600',
  haute: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-600',
}

export default function MesDemandesPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetchInterventions(user.id)
      }
    }
    init()
  }, [])

  const fetchInterventions = async (uid: string) => {
    const res = await fetch(`/api/interventions?demandeur_id=${uid}`)
    const data = await res.json()
    setInterventions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filteredInterventions = interventions.filter(int => {
    if (filter === 'all') return true
    if (filter === 'en_cours') return ['demande', 'planifiee', 'en_cours'].includes(int.statut)
    if (filter === 'terminees') return ['terminee', 'facturee', 'payee'].includes(int.statut)
    return int.statut === filter
  })

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Demandes</h1>
        <Link
          href="/dashboard/nouvelle-demande"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Nouvelle demande
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'en_cours', label: 'En cours' },
          { value: 'terminees', label: 'Terminées' },
          { value: 'annulee', label: 'Annulées' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {filteredInterventions.length > 0 ? (
          filteredInterventions.map((int) => {
            const statut = statutConfig[int.statut] || statutConfig.demande
            const StatusIcon = statut.icon

            return (
              <div key={int.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statut.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                        {typeLabels[int.type]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${prioriteColors[int.priorite]}`}>
                        {int.priorite}
                      </span>
                    </div>

                    <h3 className="font-semibold">
                      {int.chantiers?.nom || 'Chantier inconnu'}
                    </h3>
                    {int.chantiers?.clients_finaux && (
                      <p className="text-sm text-muted-foreground">
                        Client: {int.chantiers.clients_finaux.nom}
                      </p>
                    )}
                    {int.chantiers?.ville && (
                      <p className="text-sm text-muted-foreground">
                        {int.chantiers.adresse}, {int.chantiers.ville}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-sm">
                    {int.numero_dossier && (
                      <p className="font-mono text-muted-foreground">{int.numero_dossier}</p>
                    )}
                    {int.date_demande && (
                      <p className="text-muted-foreground">
                        Demande: {new Date(int.date_demande).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {int.date_planifiee && (
                      <p className="text-primary font-medium">
                        Prévue: {new Date(int.date_planifiee).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Commentaires */}
                {(int.commentaire_installateur || int.commentaire_admin) && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {int.commentaire_installateur && (
                      <div className="text-sm">
                        <span className="font-medium">Votre commentaire:</span>{' '}
                        <span className="text-muted-foreground">{int.commentaire_installateur}</span>
                      </div>
                    )}
                    {int.commentaire_admin && (
                      <div className="text-sm">
                        <span className="font-medium">Réponse PLUG2DRIVE:</span>{' '}
                        <span className="text-muted-foreground">{int.commentaire_admin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Aucune demande</p>
            <p className="text-sm">Créez une demande d&apos;intervention pour vos chantiers</p>
          </div>
        )}
      </div>
    </div>
  )
}
