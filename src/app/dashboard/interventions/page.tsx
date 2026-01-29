'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Calendar,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  MapPin,
  Phone,
  Building
} from 'lucide-react'
import type { Technicien } from '@/lib/types'

interface Intervention {
  id: string
  numero_dossier: string | null
  type: 'equilibrage' | 'desembouage' | 'maintenance'
  statut: string
  priorite: string
  date_demande: string | null
  date_planifiee: string | null
  heure_debut: string | null
  heure_fin: string | null
  commentaire_installateur: string | null
  commentaire_admin: string | null
  technicien_id: string | null
  chantiers?: {
    id: string
    nom: string
    adresse: string | null
    ville: string | null
    clients_finaux?: { nom: string }
  }
  techniciens?: {
    id: string
    nom: string
    prenom: string | null
  }
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  demande: { label: 'Demande', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  planifiee: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar },
  en_cours: { label: 'En cours', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: ClipboardList },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
  facturee: { label: 'Facturée', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
  payee: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
}

const typeLabels: Record<string, string> = {
  equilibrage: 'Équilibrage',
  desembouage: 'Désembouage',
  maintenance: 'Maintenance',
}

const prioriteConfig: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  normale: { label: 'Normale', color: 'bg-blue-100 text-blue-600' },
  haute: { label: 'Haute', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
}

export default function InterventionsAdminPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [techniciens, setTechniciens] = useState<Technicien[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('demandes')
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [planningData, setPlanningData] = useState({
    technicien_id: '',
    date_planifiee: '',
    heure_debut: '',
    heure_fin: '',
    commentaire_admin: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const [intRes, techRes] = await Promise.all([
      fetch('/api/interventions'),
      fetch('/api/techniciens'),
    ])
    const intData = await intRes.json()
    const techData = await techRes.json()
    setInterventions(Array.isArray(intData) ? intData : [])
    setTechniciens(Array.isArray(techData) ? techData : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredInterventions = interventions.filter(int => {
    if (filter === 'demandes') return int.statut === 'demande'
    if (filter === 'planifiees') return int.statut === 'planifiee'
    if (filter === 'en_cours') return int.statut === 'en_cours'
    if (filter === 'terminees') return ['terminee', 'facturee', 'payee'].includes(int.statut)
    if (filter === 'annulees') return int.statut === 'annulee'
    return true
  })

  const openPlanningModal = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setPlanningData({
      technicien_id: intervention.technicien_id || '',
      date_planifiee: intervention.date_planifiee || '',
      heure_debut: intervention.heure_debut?.slice(0, 5) || '',
      heure_fin: intervention.heure_fin?.slice(0, 5) || '',
      commentaire_admin: intervention.commentaire_admin || '',
    })
    setShowPlanningModal(true)
  }

  const handlePlanifier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIntervention) return

    await fetch('/api/interventions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedIntervention.id,
        technicien_id: planningData.technicien_id || null,
        date_planifiee: planningData.date_planifiee || null,
        heure_debut: planningData.heure_debut || null,
        heure_fin: planningData.heure_fin || null,
        commentaire_admin: planningData.commentaire_admin || null,
        statut: planningData.technicien_id && planningData.date_planifiee ? 'planifiee' : 'demande',
      }),
    })

    setShowPlanningModal(false)
    setSelectedIntervention(null)
    fetchData()
  }

  const handleStatutChange = async (id: string, newStatut: string) => {
    await fetch('/api/interventions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: newStatut }),
    })
    fetchData()
  }

  const handleAnnuler = async (id: string) => {
    if (!confirm('Annuler cette intervention ?')) return
    await handleStatutChange(id, 'annulee')
  }

  // Compteurs par statut
  const counts = {
    demandes: interventions.filter(i => i.statut === 'demande').length,
    planifiees: interventions.filter(i => i.statut === 'planifiee').length,
    en_cours: interventions.filter(i => i.statut === 'en_cours').length,
    terminees: interventions.filter(i => ['terminee', 'facturee', 'payee'].includes(i.statut)).length,
    annulees: interventions.filter(i => i.statut === 'annulee').length,
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Interventions</h1>
      </div>

      {/* Filtres avec compteurs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'demandes', label: 'Demandes', count: counts.demandes, color: 'bg-yellow-500' },
          { value: 'planifiees', label: 'Planifiées', count: counts.planifiees, color: 'bg-blue-500' },
          { value: 'en_cours', label: 'En cours', count: counts.en_cours, color: 'bg-indigo-500' },
          { value: 'terminees', label: 'Terminées', count: counts.terminees, color: 'bg-green-500' },
          { value: 'annulees', label: 'Annulées', count: counts.annulees, color: 'bg-gray-400' },
          { value: 'all', label: 'Toutes', count: interventions.length, color: 'bg-gray-600' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {f.label}
            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${f.color}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des interventions */}
      <div className="space-y-4">
        {filteredInterventions.length > 0 ? (
          filteredInterventions.map((int) => {
            const statut = statutConfig[int.statut] || statutConfig.demande
            const StatusIcon = statut.icon
            const priorite = prioriteConfig[int.priorite] || prioriteConfig.normale

            return (
              <div key={int.id} className="bg-card rounded-xl border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statut.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statut.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {typeLabels[int.type]}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorite.color}`}>
                        {priorite.label}
                      </span>
                    </div>
                    <div className="text-right">
                      {int.numero_dossier && (
                        <p className="font-mono text-sm font-medium">{int.numero_dossier}</p>
                      )}
                      {int.date_demande && (
                        <p className="text-xs text-muted-foreground">
                          Demandé le {new Date(int.date_demande).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Chantier */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold">{int.chantiers?.nom || 'Chantier non défini'}</h3>
                      </div>
                      {int.chantiers?.clients_finaux && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Client: {int.chantiers.clients_finaux.nom}
                        </p>
                      )}
                      {int.chantiers?.adresse && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {int.chantiers.adresse}, {int.chantiers.ville}
                        </p>
                      )}
                    </div>

                    {/* Planning */}
                    <div className="space-y-2">
                      {int.techniciens ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {int.techniciens.prenom} {int.techniciens.nom}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm">Non assigné</span>
                        </div>
                      )}
                      {int.date_planifiee ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {new Date(int.date_planifiee).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                          {int.heure_debut && (
                            <span className="text-sm text-muted-foreground">
                              {int.heure_debut.slice(0, 5)}
                              {int.heure_fin && ` - ${int.heure_fin.slice(0, 5)}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Non planifié</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commentaires */}
                  {(int.commentaire_installateur || int.commentaire_admin) && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {int.commentaire_installateur && (
                        <div className="text-sm">
                          <span className="font-medium">Note installateur:</span>{' '}
                          <span className="text-muted-foreground">{int.commentaire_installateur}</span>
                        </div>
                      )}
                      {int.commentaire_admin && (
                        <div className="text-sm">
                          <span className="font-medium">Note admin:</span>{' '}
                          <span className="text-muted-foreground">{int.commentaire_admin}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
                  {int.statut === 'demande' && (
                    <>
                      <button
                        onClick={() => openPlanningModal(int)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        <Calendar className="w-4 h-4" />
                        Planifier
                      </button>
                      <button
                        onClick={() => handleAnnuler(int.id)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-red-50 text-red-600 transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    </>
                  )}
                  {int.statut === 'planifiee' && (
                    <>
                      <button
                        onClick={() => openPlanningModal(int)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        Modifier planning
                      </button>
                      <button
                        onClick={() => handleAnnuler(int.id)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-red-50 text-red-600 transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    </>
                  )}
                  {int.statut === 'terminee' && (
                    <button
                      onClick={() => handleStatutChange(int.id, 'facturee')}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer facturée
                    </button>
                  )}
                  {int.statut === 'facturee' && (
                    <button
                      onClick={() => handleStatutChange(int.id, 'payee')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer payée
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Aucune intervention</p>
            <p className="text-sm">dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Modal Planning */}
      {showPlanningModal && selectedIntervention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Planifier l&apos;intervention
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedIntervention.chantiers?.nom} - {typeLabels[selectedIntervention.type]}
            </p>

            <form onSubmit={handlePlanifier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Technicien *</label>
                <select
                  required
                  value={planningData.technicien_id}
                  onChange={(e) => setPlanningData({ ...planningData, technicien_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">-- Sélectionner --</option>
                  {techniciens.filter(t => t.actif).map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.prenom} {tech.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={planningData.date_planifiee}
                  onChange={(e) => setPlanningData({ ...planningData, date_planifiee: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Heure début</label>
                  <input
                    type="time"
                    value={planningData.heure_debut}
                    onChange={(e) => setPlanningData({ ...planningData, heure_debut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure fin</label>
                  <input
                    type="time"
                    value={planningData.heure_fin}
                    onChange={(e) => setPlanningData({ ...planningData, heure_fin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instructions pour le technicien</label>
                <textarea
                  value={planningData.commentaire_admin}
                  onChange={(e) => setPlanningData({ ...planningData, commentaire_admin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  rows={3}
                  placeholder="Instructions spéciales, accès, contacts..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanningModal(false)
                    setSelectedIntervention(null)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Valider le planning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
