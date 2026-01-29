'use client'

import { useState, useEffect, Suspense } from 'react'
import { Plus, Pencil, Trash2, Building, X, Check, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
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
  adresse_complement: string | null
  code_postal: string | null
  ville: string | null
  nb_appartements: number | null
  zone_climatique: string | null
  gardien_nom: string | null
  gardien_tel: string | null
  digicode: string | null
  acces_info: string | null
  clients_finaux?: { nom: string }
}

function MesChantiersContent() {
  const searchParams = useSearchParams()
  const clientFilter = searchParams.get('client')

  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    client_id: clientFilter || '',
    nom: '',
    adresse: '',
    adresse_complement: '',
    code_postal: '',
    ville: '',
    nb_appartements: '',
    zone_climatique: '' as 'H1' | 'H2' | 'H3' | '',
    gardien_nom: '',
    gardien_tel: '',
    digicode: '',
    acces_info: '',
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await Promise.all([
          fetchClients(user.id),
          fetchChantiers(user.id, clientFilter),
        ])
      }
      setLoading(false)
    }
    init()
  }, [clientFilter])

  const fetchClients = async (uid: string) => {
    const res = await fetch(`/api/clients?created_by=${uid}`)
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
  }

  const fetchChantiers = async (uid: string, clientId: string | null) => {
    let url = `/api/chantiers?created_by=${uid}`
    if (clientId) url += `&client_id=${clientId}`
    const res = await fetch(url)
    const data = await res.json()
    setChantiers(Array.isArray(data) ? data : [])
  }

  const resetForm = () => {
    setFormData({
      client_id: clientFilter || '',
      nom: '',
      adresse: '',
      adresse_complement: '',
      code_postal: '',
      ville: '',
      nb_appartements: '',
      zone_climatique: '',
      gardien_nom: '',
      gardien_tel: '',
      digicode: '',
      acces_info: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (chantier: Chantier) => {
    setFormData({
      client_id: chantier.client_id || '',
      nom: chantier.nom || '',
      adresse: chantier.adresse || '',
      adresse_complement: chantier.adresse_complement || '',
      code_postal: chantier.code_postal || '',
      ville: chantier.ville || '',
      nb_appartements: chantier.nb_appartements?.toString() || '',
      zone_climatique: (chantier.zone_climatique as 'H1' | 'H2' | 'H3') || '',
      gardien_nom: chantier.gardien_nom || '',
      gardien_tel: chantier.gardien_tel || '',
      digicode: chantier.digicode || '',
      acces_info: chantier.acces_info || '',
    })
    setEditingId(chantier.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const payload = {
      client_id: formData.client_id || null,
      nom: formData.nom,
      adresse: formData.adresse || null,
      adresse_complement: formData.adresse_complement || null,
      code_postal: formData.code_postal || null,
      ville: formData.ville || null,
      nb_appartements: formData.nb_appartements ? parseInt(formData.nb_appartements) : null,
      zone_climatique: formData.zone_climatique || null,
      gardien_nom: formData.gardien_nom || null,
      gardien_tel: formData.gardien_tel || null,
      digicode: formData.digicode || null,
      acces_info: formData.acces_info || null,
    }
    const body = editingId ? { id: editingId, ...payload } : payload

    await fetch('/api/chantiers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    resetForm()
    if (userId) fetchChantiers(userId, clientFilter)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce chantier ?')) return
    await fetch('/api/chantiers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (userId) fetchChantiers(userId, clientFilter)
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  const selectedClient = clients.find(c => c.id === clientFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Chantiers</h1>
          {selectedClient && (
            <p className="text-muted-foreground">Client: {selectedClient.nom}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau chantier
        </button>
      </div>

      {/* Formulaire Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier' : 'Nouveau'} chantier
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom du chantier *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Ex: Résidence Les Lilas"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Complément</label>
                  <input
                    type="text"
                    value={formData.adresse_complement}
                    onChange={(e) => setFormData({ ...formData, adresse_complement: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Bât, escalier..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code postal</label>
                  <input
                    type="text"
                    value={formData.code_postal}
                    onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nb appartements</label>
                  <input
                    type="number"
                    value={formData.nb_appartements}
                    onChange={(e) => setFormData({ ...formData, nb_appartements: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zone climatique</label>
                  <select
                    value={formData.zone_climatique}
                    onChange={(e) => setFormData({ ...formData, zone_climatique: e.target.value as typeof formData.zone_climatique })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="H1">H1</option>
                    <option value="H2">H2</option>
                    <option value="H3">H3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gardien (nom)</label>
                  <input
                    type="text"
                    value={formData.gardien_nom}
                    onChange={(e) => setFormData({ ...formData, gardien_nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gardien (tél)</label>
                  <input
                    type="tel"
                    value={formData.gardien_tel}
                    onChange={(e) => setFormData({ ...formData, gardien_tel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Digicode</label>
                  <input
                    type="text"
                    value={formData.digicode}
                    onChange={(e) => setFormData({ ...formData, digicode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Infos accès</label>
                  <textarea
                    value={formData.acces_info}
                    onChange={(e) => setFormData({ ...formData, acces_info: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    rows={2}
                    placeholder="Clés, horaires d'accès..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chantiers.length > 0 ? (
          chantiers.map((chantier) => (
            <div key={chantier.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{chantier.nom}</h3>
                  {chantier.clients_finaux && (
                    <p className="text-sm text-muted-foreground">{chantier.clients_finaux.nom}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(chantier)}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(chantier.id)}
                    className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {chantier.adresse && <p>{chantier.adresse}</p>}
                {(chantier.code_postal || chantier.ville) && (
                  <p>{chantier.code_postal} {chantier.ville}</p>
                )}
                {chantier.nb_appartements && <p>{chantier.nb_appartements} appartements</p>}
              </div>

              <div className="mt-4 pt-3 border-t">
                <Link
                  href={`/dashboard/nouvelle-demande?chantier=${chantier.id}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ClipboardList className="w-4 h-4" />
                  Demander une intervention
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Aucun chantier</p>
            <p className="text-sm">Créez votre premier chantier pour demander une intervention</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MesChantiersPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <MesChantiersContent />
    </Suspense>
  )
}
