'use client'

import { useState, useEffect, Suspense } from 'react'
import { Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  nom: string
}

interface Chantier {
  id: string
  client_id: string | null
  nom: string
  adresse: string | null
  ville: string | null
}

function NouvellDemandeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chantierParam = searchParams.get('chantier')

  const [clients, setClients] = useState<Client[]>([])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    chantier_id: chantierParam || '',
    type: '' as 'equilibrage' | 'desembouage' | '',
    priorite: 'normale' as 'basse' | 'normale' | 'haute' | 'urgente',
    commentaire_installateur: '',
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await fetchClients(user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (formData.client_id) {
      fetchChantiers(formData.client_id)
    } else {
      setChantiers([])
    }
  }, [formData.client_id])

  // Si chantier pré-sélectionné, charger son client
  useEffect(() => {
    if (chantierParam && chantiers.length > 0) {
      const chantier = chantiers.find(c => c.id === chantierParam)
      if (chantier?.client_id) {
        setFormData(prev => ({ ...prev, client_id: chantier.client_id! }))
      }
    }
  }, [chantierParam, chantiers])

  const fetchClients = async (uid: string) => {
    const res = await fetch(`/api/clients?created_by=${uid}`)
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
  }

  const fetchChantiers = async (clientId: string) => {
    const res = await fetch(`/api/chantiers?client_id=${clientId}`)
    const data = await res.json()
    setChantiers(Array.isArray(data) ? data : [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.chantier_id || !formData.type) return

    setSubmitting(true)

    const payload = {
      chantier_id: formData.chantier_id,
      demandeur_id: userId,
      type: formData.type,
      priorite: formData.priorite,
      commentaire_installateur: formData.commentaire_installateur || null,
      statut: 'demande',
      date_demande: new Date().toISOString(),
    }

    const res = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      router.push('/dashboard/mes-demandes')
    } else {
      setSubmitting(false)
      alert('Erreur lors de la création de la demande')
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/mes-chantiers"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nouvelle demande d&apos;intervention</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-6">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium mb-2">Client *</label>
          <select
            required
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value, chantier_id: '' })}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="">-- Sélectionner un client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {/* Chantier */}
        <div>
          <label className="block text-sm font-medium mb-2">Chantier *</label>
          <select
            required
            value={formData.chantier_id}
            onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-background"
            disabled={!formData.client_id}
          >
            <option value="">-- Sélectionner un chantier --</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.ville && `- ${c.ville}`}
              </option>
            ))}
          </select>
          {formData.client_id && chantiers.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Aucun chantier pour ce client.{' '}
              <Link href="/dashboard/mes-chantiers" className="text-primary hover:underline">
                Créer un chantier
              </Link>
            </p>
          )}
        </div>

        {/* Type d&apos;intervention */}
        <div>
          <label className="block text-sm font-medium mb-2">Type d&apos;intervention *</label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.type === 'equilibrage'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="type"
                value="equilibrage"
                checked={formData.type === 'equilibrage'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'equilibrage' })}
                className="sr-only"
              />
              <div>
                <p className="font-medium">Équilibrage</p>
                <p className="text-sm text-muted-foreground">Équilibrage hydraulique du réseau</p>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.type === 'desembouage'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="type"
                value="desembouage"
                checked={formData.type === 'desembouage'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'desembouage' })}
                className="sr-only"
              />
              <div>
                <p className="font-medium">Désembouage</p>
                <p className="text-sm text-muted-foreground">Traitement et nettoyage du circuit</p>
              </div>
            </label>
          </div>
        </div>

        {/* Priorité */}
        <div>
          <label className="block text-sm font-medium mb-2">Priorité</label>
          <select
            value={formData.priorite}
            onChange={(e) => setFormData({ ...formData, priorite: e.target.value as typeof formData.priorite })}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-medium mb-2">Commentaire / Instructions</label>
          <textarea
            value={formData.commentaire_installateur}
            onChange={(e) => setFormData({ ...formData, commentaire_installateur: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-background"
            rows={4}
            placeholder="Informations complémentaires, contraintes horaires, etc."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/dashboard/mes-chantiers"
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting || !formData.chantier_id || !formData.type}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NouvelleDemandePage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <NouvellDemandeContent />
    </Suspense>
  )
}
