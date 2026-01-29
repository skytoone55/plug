'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Key,
  Users,
  FileText,
  Droplets,
  Plus,
  Calendar,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

interface Client {
  id: string
  nom: string
  type: string | null
}

interface Chantier {
  id: string
  nom: string
  adresse: string | null
  adresse_complement: string | null
  code_postal: string | null
  ville: string | null
  gardien_nom: string | null
  gardien_tel: string | null
  digicode: string | null
  acces_info: string | null
  nb_appartements: number | null
  nb_batiments: number | null
  type_travaux: string[] | null
  statut: string | null
  client_id: string | null
  clients_finaux?: Client
  created_at: string
}

interface Rapport {
  id: string
  numero_dossier: string | null
  date_intervention: string | null
  statut: string | null
  reclamation_note: string | null
  reclamation_date: string | null
  created_at: string
}

const statutChantierConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  annule: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const statutRapportConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_preparation: { label: 'En préparation', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pret: { label: 'Prêt', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  livre: { label: 'Livré', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  conteste: { label: 'Contesté', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function ChantierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [chantier, setChantier] = useState<Chantier | null>(null)
  const [rapportsEquilibrage, setRapportsEquilibrage] = useState<Rapport[]>([])
  const [rapportsDesembouage, setRapportsDesembouage] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [showReclamationModal, setShowReclamationModal] = useState<{ type: 'equilibrage' | 'desembouage'; id: string } | null>(null)
  const [reclamationNote, setReclamationNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return

      const chantierRes = await fetch(`/api/chantiers?id=${params.id}`)
      const chantiersData = await chantierRes.json()
      const chantierData = Array.isArray(chantiersData)
        ? chantiersData.find((c: Chantier) => c.id === params.id)
        : null
      setChantier(chantierData)

      const [eqRes, desRes] = await Promise.all([
        fetch(`/api/rapports/equilibrage?chantier_id=${params.id}`),
        fetch(`/api/rapports/desembouage?chantier_id=${params.id}`),
      ])

      const eqData = await eqRes.json()
      const desData = await desRes.json()

      setRapportsEquilibrage(Array.isArray(eqData) ? eqData : [])
      setRapportsDesembouage(Array.isArray(desData) ? desData : [])
      setLoading(false)
    }

    fetchData()
  }, [params.id])

  const handleReclamation = async () => {
    if (!showReclamationModal || !reclamationNote.trim()) return

    setSubmitting(true)
    try {
      const endpoint = showReclamationModal.type === 'equilibrage'
        ? '/api/rapports/equilibrage'
        : '/api/rapports/desembouage'

      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showReclamationModal.id,
          statut: 'conteste',
          reclamation_note: reclamationNote,
          reclamation_date: new Date().toISOString(),
        }),
      })

      // Refresh data
      const res = await fetch(`/api/rapports/${showReclamationModal.type}?chantier_id=${params.id}`)
      const data = await res.json()
      if (showReclamationModal.type === 'equilibrage') {
        setRapportsEquilibrage(Array.isArray(data) ? data : [])
      } else {
        setRapportsDesembouage(Array.isArray(data) ? data : [])
      }

      setShowReclamationModal(null)
      setReclamationNote('')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!chantier) {
    return (
      <div className="p-6">
        <p>Chantier non trouvé</p>
        <Link href="/dashboard/chantiers" className="text-primary hover:underline">
          Retour aux chantiers
        </Link>
      </div>
    )
  }

  const hasEquilibrage = chantier.type_travaux?.includes('equilibrage')
  const hasDesembouage = chantier.type_travaux?.includes('desembouage')
  const chantierStatut = statutChantierConfig[chantier.statut || 'en_attente']
  const ChantierStatutIcon = chantierStatut.icon

  const renderRapportCard = (rapport: Rapport, type: 'equilibrage' | 'desembouage') => {
    const statut = statutRapportConfig[rapport.statut || 'en_preparation']
    const StatutIcon = statut.icon
    const isConteste = rapport.statut === 'conteste'
    const canContest = rapport.statut === 'pret' || rapport.statut === 'livre'

    return (
      <div
        key={rapport.id}
        className="p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Link
              href={`/dashboard/${type === 'equilibrage' ? 'rapport-form' : 'desembouage-form'}?id=${rapport.id}`}
              className="font-medium hover:text-primary"
            >
              {rapport.numero_dossier || 'Sans numéro'}
            </Link>
            {rapport.date_intervention && (
              <p className="text-sm text-muted-foreground">
                {new Date(rapport.date_intervention).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
              <StatutIcon className="w-3 h-3" />
              {statut.label}
            </span>
            {canContest && (
              <button
                onClick={() => setShowReclamationModal({ type, id: rapport.id })}
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs hover:bg-orange-200 transition-colors"
              >
                <AlertTriangle className="w-3 h-3" />
                Contester
              </button>
            )}
            <Link
              href={`/dashboard/${type === 'equilibrage' ? 'rapport-form' : 'desembouage-form'}?id=${rapport.id}`}
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
        {isConteste && rapport.reclamation_note && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Réclamation:</strong> {rapport.reclamation_note}
            </p>
            {rapport.reclamation_date && (
              <p className="text-xs text-red-500 mt-1">
                Le {new Date(rapport.reclamation_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{chantier.nom}</h1>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${chantierStatut.color}`}>
              <ChantierStatutIcon className="w-4 h-4" />
              {chantierStatut.label}
            </span>
          </div>
          {chantier.clients_finaux && (
            <Link
              href={`/dashboard/clients/${chantier.clients_finaux.id}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Client: {chantier.clients_finaux.nom}
            </Link>
          )}
        </div>
      </div>

      {/* Informations du chantier */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Colonne gauche - Infos */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Informations</h2>

          {/* Types de travaux */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Types de travaux</p>
            <div className="flex gap-2">
              {chantier.type_travaux?.map((type) => (
                <span
                  key={type}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    type === 'equilibrage'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {type === 'equilibrage' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <Droplets className="w-4 h-4" />
                  )}
                  {type === 'equilibrage' ? 'Équilibrage' : 'Désembouage'}
                </span>
              ))}
            </div>
          </div>

          {/* Adresse */}
          {chantier.adresse && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p>{chantier.adresse}</p>
                {chantier.adresse_complement && (
                  <p className="text-muted-foreground">{chantier.adresse_complement}</p>
                )}
                <p className="text-muted-foreground">
                  {chantier.code_postal} {chantier.ville}
                </p>
              </div>
            </div>
          )}

          {/* Infos bâtiment */}
          <div className="flex items-center gap-6">
            {chantier.nb_appartements && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span>{chantier.nb_appartements} appartements</span>
              </div>
            )}
            {chantier.nb_batiments && (
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-muted-foreground" />
                <span>{chantier.nb_batiments} bâtiment(s)</span>
              </div>
            )}
          </div>

          {/* Accès */}
          {(chantier.gardien_nom || chantier.digicode || chantier.acces_info) && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground">Accès</p>
              {chantier.gardien_nom && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>Gardien: {chantier.gardien_nom}</span>
                  {chantier.gardien_tel && (
                    <a
                      href={`tel:${chantier.gardien_tel}`}
                      className="text-primary hover:underline"
                    >
                      {chantier.gardien_tel}
                    </a>
                  )}
                </div>
              )}
              {chantier.digicode && (
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span>Digicode:</span>
                  <code className="bg-muted px-2 py-1 rounded">{chantier.digicode}</code>
                </div>
              )}
              {chantier.acces_info && (
                <p className="text-sm text-muted-foreground">{chantier.acces_info}</p>
              )}
            </div>
          )}

          {/* Date création */}
          <div className="pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Créé le {new Date(chantier.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Colonne droite - Rapports */}
        <div className="space-y-6">
          {/* Rapports Équilibrage */}
          {hasEquilibrage && (
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Rapports Équilibrage</h3>
                  <span className="text-sm text-muted-foreground">
                    ({rapportsEquilibrage.length})
                  </span>
                </div>
                <Link
                  href={`/dashboard/rapport-form?chantier_id=${chantier.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau
                </Link>
              </div>
              <div>
                {rapportsEquilibrage.length > 0 ? (
                  rapportsEquilibrage.map((rapport) => renderRapportCard(rapport, 'equilibrage'))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Aucun rapport d&apos;équilibrage</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rapports Désembouage */}
          {hasDesembouage && (
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Rapports Désembouage</h3>
                  <span className="text-sm text-muted-foreground">
                    ({rapportsDesembouage.length})
                  </span>
                </div>
                <Link
                  href={`/dashboard/desembouage-form?chantier_id=${chantier.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau
                </Link>
              </div>
              <div>
                {rapportsDesembouage.length > 0 ? (
                  rapportsDesembouage.map((rapport) => renderRapportCard(rapport, 'desembouage'))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Aucun rapport de désembouage</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de réclamation */}
      {showReclamationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Contester ce rapport
            </h3>
            <p className="text-sm text-muted-foreground">
              Décrivez le problème rencontré avec ce rapport. L&apos;équipe administrative sera notifiée et corrigera le rapport.
            </p>
            <textarea
              value={reclamationNote}
              onChange={(e) => setReclamationNote(e.target.value)}
              placeholder="Décrivez le problème..."
              className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReclamationModal(null)
                  setReclamationNote('')
                }}
                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReclamation}
                disabled={!reclamationNote.trim() || submitting}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Envoi...' : 'Envoyer la réclamation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
