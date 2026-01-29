'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Wrench, X, Check } from 'lucide-react'
import type { Technicien, Installateur } from '@/lib/types'

export default function TechniciensPage() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([])
  const [installateurs, setInstallateurs] = useState<Installateur[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    installateur_id: '',
    telephone: '',
    email: '',
    certifications: '',
  })

  const fetchData = async () => {
    const [techRes, instRes] = await Promise.all([
      fetch('/api/techniciens'),
      fetch('/api/installateurs'),
    ])
    setTechniciens(await techRes.json())
    setInstallateurs(await instRes.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      installateur_id: '',
      telephone: '',
      email: '',
      certifications: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (tech: Technicien) => {
    setFormData({
      nom: tech.nom || '',
      prenom: tech.prenom || '',
      installateur_id: tech.installateur_id || '',
      telephone: tech.telephone || '',
      email: tech.email || '',
      certifications: tech.certifications?.join(', ') || '',
    })
    setEditingId(tech.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const payload = {
      nom: formData.nom,
      prenom: formData.prenom || null,
      installateur_id: formData.installateur_id || null,
      telephone: formData.telephone || null,
      email: formData.email || null,
      certifications: formData.certifications
        ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }
    const body = editingId ? { id: editingId, ...payload } : payload

    await fetch('/api/techniciens', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce technicien ?')) return
    await fetch('/api/techniciens', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Techniciens</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau technicien
        </button>
      </div>

      {/* Formulaire Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier' : 'Nouveau'} technicien
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
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
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div className="col-span-2">
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Certifications</label>
                  <input
                    type="text"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Séparées par des virgules"
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
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prénom</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Téléphone</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Installateur</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {techniciens.length > 0 ? (
              techniciens.map((tech: Technicien & { installateurs?: { nom: string } }) => (
                <tr key={tech.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{tech.nom}</td>
                  <td className="py-3 px-4 text-sm">{tech.prenom || '-'}</td>
                  <td className="py-3 px-4 text-sm">{tech.telephone || '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {tech.installateurs?.nom || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tech.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tech.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleEdit(tech)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors inline-flex"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tech.id)}
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
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun technicien</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
