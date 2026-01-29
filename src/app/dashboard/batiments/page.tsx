'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building, X, Check } from 'lucide-react'
import type { Batiment, ClientFinal } from '@/lib/types'

export default function BatimentsPage() {
  const [batiments, setBatiments] = useState<Batiment[]>([])
  const [clients, setClients] = useState<ClientFinal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    client_final_id: '',
    adresse: '',
    adresse_ligne2: '',
    code_postal: '',
    ville: '',
    reference_cadastrale: '',
    zone_climatique: '' as 'H1' | 'H2' | 'H3' | '',
    nb_appartements: '',
    nb_batiments: '1',
    nb_etages: '',
    annee_construction: '',
    type_chauffage: '',
    nature_reseau: '' as 'Acier' | 'Cuivre' | 'Multicouche' | 'Synthetique' | '',
    puissance_nominale_kw: '',
    gardien_nom: '',
    gardien_tel: '',
    acces_info: '',
  })

  const fetchData = async () => {
    const [batimentsRes, clientsRes] = await Promise.all([
      fetch('/api/batiments'),
      fetch('/api/clients'),
    ])
    setBatiments(await batimentsRes.json())
    setClients(await clientsRes.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setFormData({
      nom: '',
      client_final_id: '',
      adresse: '',
      adresse_ligne2: '',
      code_postal: '',
      ville: '',
      reference_cadastrale: '',
      zone_climatique: '',
      nb_appartements: '',
      nb_batiments: '1',
      nb_etages: '',
      annee_construction: '',
      type_chauffage: '',
      nature_reseau: '',
      puissance_nominale_kw: '',
      gardien_nom: '',
      gardien_tel: '',
      acces_info: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (bat: Batiment) => {
    setFormData({
      nom: bat.nom || '',
      client_final_id: bat.client_final_id || '',
      adresse: bat.adresse || '',
      adresse_ligne2: bat.adresse_ligne2 || '',
      code_postal: bat.code_postal || '',
      ville: bat.ville || '',
      reference_cadastrale: bat.reference_cadastrale || '',
      zone_climatique: bat.zone_climatique || '',
      nb_appartements: bat.nb_appartements?.toString() || '',
      nb_batiments: bat.nb_batiments?.toString() || '1',
      nb_etages: bat.nb_etages?.toString() || '',
      annee_construction: bat.annee_construction?.toString() || '',
      type_chauffage: bat.type_chauffage || '',
      nature_reseau: bat.nature_reseau || '',
      puissance_nominale_kw: bat.puissance_nominale_kw?.toString() || '',
      gardien_nom: bat.gardien_nom || '',
      gardien_tel: bat.gardien_tel || '',
      acces_info: bat.acces_info || '',
    })
    setEditingId(bat.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const payload = {
      nom: formData.nom,
      client_final_id: formData.client_final_id || null,
      adresse: formData.adresse || null,
      adresse_ligne2: formData.adresse_ligne2 || null,
      code_postal: formData.code_postal || null,
      ville: formData.ville || null,
      reference_cadastrale: formData.reference_cadastrale || null,
      zone_climatique: formData.zone_climatique || null,
      nb_appartements: formData.nb_appartements ? parseInt(formData.nb_appartements) : null,
      nb_batiments: formData.nb_batiments ? parseInt(formData.nb_batiments) : 1,
      nb_etages: formData.nb_etages ? parseInt(formData.nb_etages) : null,
      annee_construction: formData.annee_construction ? parseInt(formData.annee_construction) : null,
      type_chauffage: formData.type_chauffage || null,
      nature_reseau: formData.nature_reseau || null,
      puissance_nominale_kw: formData.puissance_nominale_kw ? parseInt(formData.puissance_nominale_kw) : null,
      gardien_nom: formData.gardien_nom || null,
      gardien_tel: formData.gardien_tel || null,
      acces_info: formData.acces_info || null,
    }
    const body = editingId ? { id: editingId, ...payload } : payload

    await fetch('/api/batiments', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce bâtiment ?')) return
    await fetch('/api/batiments', {
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
        <h1 className="text-2xl font-bold">Bâtiments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau bâtiment
        </button>
      </div>

      {/* Formulaire Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier' : 'Nouveau'} bâtiment
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom du site *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="ex: Résidence Les Lilas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select
                    value={formData.client_final_id}
                    onChange={(e) => setFormData({ ...formData, client_final_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
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
                  <label className="block text-sm font-medium mb-1">Complément</label>
                  <input
                    type="text"
                    value={formData.adresse_ligne2}
                    onChange={(e) => setFormData({ ...formData, adresse_ligne2: e.target.value })}
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
                  <label className="block text-sm font-medium mb-1">Nb appartements</label>
                  <input
                    type="number"
                    value={formData.nb_appartements}
                    onChange={(e) => setFormData({ ...formData, nb_appartements: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nb bâtiments</label>
                  <input
                    type="number"
                    value={formData.nb_batiments}
                    onChange={(e) => setFormData({ ...formData, nb_batiments: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nb étages</label>
                  <input
                    type="number"
                    value={formData.nb_etages}
                    onChange={(e) => setFormData({ ...formData, nb_etages: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type chauffage</label>
                  <input
                    type="text"
                    value={formData.type_chauffage}
                    onChange={(e) => setFormData({ ...formData, type_chauffage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="ex: Collectif gaz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nature réseau</label>
                  <select
                    value={formData.nature_reseau}
                    onChange={(e) => setFormData({ ...formData, nature_reseau: e.target.value as typeof formData.nature_reseau })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Acier">Acier</option>
                    <option value="Cuivre">Cuivre</option>
                    <option value="Multicouche">Multicouche</option>
                    <option value="Synthetique">Synthétique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Puissance (kW)</label>
                  <input
                    type="number"
                    value={formData.puissance_nominale_kw}
                    onChange={(e) => setFormData({ ...formData, puissance_nominale_kw: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
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
                  <label className="block text-sm font-medium mb-1">Réf. cadastrale</label>
                  <input
                    type="text"
                    value={formData.reference_cadastrale}
                    onChange={(e) => setFormData({ ...formData, reference_cadastrale: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Infos accès</label>
                  <textarea
                    value={formData.acces_info}
                    onChange={(e) => setFormData({ ...formData, acces_info: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    rows={2}
                    placeholder="Digicode, clés, horaires..."
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
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Adresse</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Appts</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Zone</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batiments.length > 0 ? (
              batiments.map((bat: Batiment & { clients_finaux?: { nom: string } }) => (
                <tr key={bat.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{bat.nom}</td>
                  <td className="py-3 px-4 text-sm">
                    {bat.adresse && `${bat.adresse}, `}{bat.code_postal} {bat.ville}
                  </td>
                  <td className="py-3 px-4 text-sm">{bat.nb_appartements || '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {bat.clients_finaux?.nom || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {bat.zone_climatique && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        {bat.zone_climatique}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleEdit(bat)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors inline-flex"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bat.id)}
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
                  <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun bâtiment</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
