'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users, X, Check, Eye } from 'lucide-react'
import Link from 'next/link'
import type { ClientFinal, Installateur } from '@/lib/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientFinal[]>([])
  const [installateurs, setInstallateurs] = useState<Installateur[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    type: '' as 'syndic' | 'bailleur' | 'copropriete' | 'particulier' | '',
    installateur_id: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephone: '',
    email: '',
    contact_nom: '',
    contact_tel: '',
    notes: '',
  })

  const fetchData = async () => {
    const [clientsRes, installateursRes] = await Promise.all([
      fetch('/api/clients'),
      fetch('/api/installateurs'),
    ])
    setClients(await clientsRes.json())
    setInstallateurs(await installateursRes.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setFormData({
      nom: '',
      type: '',
      installateur_id: '',
      adresse: '',
      code_postal: '',
      ville: '',
      telephone: '',
      email: '',
      contact_nom: '',
      contact_tel: '',
      notes: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (client: ClientFinal) => {
    setFormData({
      nom: client.nom || '',
      type: client.type || '',
      installateur_id: client.installateur_id || '',
      adresse: client.adresse || '',
      code_postal: client.code_postal || '',
      ville: client.ville || '',
      telephone: client.telephone || '',
      email: client.email || '',
      contact_nom: client.contact_nom || '',
      contact_tel: client.contact_tel || '',
      notes: client.notes || '',
    })
    setEditingId(client.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const payload = {
      ...formData,
      installateur_id: formData.installateur_id || null,
      type: formData.type || null,
    }
    const body = editingId ? { id: editingId, ...payload } : payload

    await fetch('/api/clients', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
  }

  const typeLabels: Record<string, string> = {
    syndic: 'Syndic',
    bailleur: 'Bailleur',
    copropriete: 'Copropriété',
    particulier: 'Particulier',
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      {/* Formulaire Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier' : 'Nouveau'} client
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="syndic">Syndic</option>
                    <option value="bailleur">Bailleur</option>
                    <option value="copropriete">Copropriété</option>
                    <option value="particulier">Particulier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Installateur</label>
                  <select
                    value={formData.installateur_id}
                    onChange={(e) => setFormData({ ...formData, installateur_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner --</option>
                    {installateurs.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.nom}</option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact (nom)</label>
                  <input
                    type="text"
                    value={formData.contact_nom}
                    onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact (tél)</label>
                  <input
                    type="tel"
                    value={formData.contact_tel}
                    onChange={(e) => setFormData({ ...formData, contact_tel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    rows={2}
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
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ville</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Installateur</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((client: ClientFinal & { installateurs?: { nom: string } }) => (
                <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{client.nom}</td>
                  <td className="py-3 px-4">
                    {client.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {typeLabels[client.type]}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">{client.ville || '-'}</td>
                  <td className="py-3 px-4 text-sm">{client.contact_nom || '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {client.installateurs?.nom || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors inline-flex"
                      title="Voir les chantiers"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors inline-flex ml-1"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors inline-flex ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun client</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
