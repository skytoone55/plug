'use client'

import { useState, useEffect } from 'react'
import {
  Building,
  MapPin,
  Plus,
  Search,
  FileText,
  Droplets,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'

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
}

const typeTravauxLabels: Record<string, { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  equilibrage: { label: 'Équilibrage', shortLabel: 'Éq.', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  desembouage: { label: 'Désembouage', shortLabel: 'Dés.', icon: Droplets, color: 'bg-purple-100 text-purple-700' },
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_attente: { label: 'En attente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  annule: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    client_id: '',
    adresse: '',
    adresse_complement: '',
    code_postal: '',
    ville: '',
    gardien_nom: '',
    gardien_tel: '',
    digicode: '',
    acces_info: '',
    nb_appartements: '',
    nb_batiments: '',
    type_travaux: [] as string[],
  })

  const fetchData = async () => {
    setLoading(true)
    const [chantiersRes, clientsRes] = await Promise.all([
      fetch('/api/chantiers'),
      fetch('/api/clients'),
    ])
    const chantiersData = await chantiersRes.json()
    const clientsData = await clientsRes.json()
    setChantiers(Array.isArray(chantiersData) ? chantiersData : [])
    setClients(Array.isArray(clientsData) ? clientsData : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredChantiers = chantiers.filter(chantier => {
    if (search === '') return true
    const searchLower = search.toLowerCase()
    return (
      chantier.nom.toLowerCase().includes(searchLower) ||
      chantier.ville?.toLowerCase().includes(searchLower) ||
      chantier.clients_finaux?.nom.toLowerCase().includes(searchLower)
    )
  })

  const openCreateModal = () => {
    setEditingChantier(null)
    setFormData({
      nom: '',
      client_id: '',
      adresse: '',
      adresse_complement: '',
      code_postal: '',
      ville: '',
      gardien_nom: '',
      gardien_tel: '',
      digicode: '',
      acces_info: '',
      nb_appartements: '',
      nb_batiments: '',
      type_travaux: [],
    })
    setShowModal(true)
  }

  const openEditModal = (chantier: Chantier) => {
    setEditingChantier(chantier)
    setFormData({
      nom: chantier.nom,
      client_id: chantier.client_id || '',
      adresse: chantier.adresse || '',
      adresse_complement: chantier.adresse_complement || '',
      code_postal: chantier.code_postal || '',
      ville: chantier.ville || '',
      gardien_nom: chantier.gardien_nom || '',
      gardien_tel: chantier.gardien_tel || '',
      digicode: chantier.digicode || '',
      acces_info: chantier.acces_info || '',
      nb_appartements: chantier.nb_appartements?.toString() || '',
      nb_batiments: chantier.nb_batiments?.toString() || '',
      type_travaux: chantier.type_travaux || [],
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      nb_appartements: formData.nb_appartements ? parseInt(formData.nb_appartements) : null,
      nb_batiments: formData.nb_batiments ? parseInt(formData.nb_batiments) : null,
      client_id: formData.client_id || null,
      type_travaux: formData.type_travaux.length > 0 ? formData.type_travaux : null,
    }

    if (editingChantier) {
      await fetch('/api/chantiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingChantier.id, ...payload }),
      })
    } else {
      await fetch('/api/chantiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce chantier ?')) return
    await fetch('/api/chantiers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
  }

  const toggleTypeTravaux = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type_travaux: prev.type_travaux.includes(type)
        ? prev.type_travaux.filter(t => t !== type)
        : [...prev.type_travaux, type],
    }))
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chantiers</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau chantier
        </button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un chantier, ville ou client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
        />
      </div>

      {/* Liste des chantiers - Tableau */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Site</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Adresse</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Lots</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Travaux</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChantiers.length > 0 ? (
              filteredChantiers.map((chantier) => {
                const statut = statutConfig[chantier.statut || 'en_attente']
                const StatutIcon = statut.icon
                return (
                  <tr key={chantier.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{chantier.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {chantier.clients_finaux ? (
                        <Link
                          href={`/dashboard/clients/${chantier.clients_finaux.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <UserCheck className="w-3 h-3" />
                          {chantier.clients_finaux.nom}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {chantier.adresse ? `${chantier.adresse}, ${chantier.ville || ''}` : chantier.ville || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{chantier.nb_appartements || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {chantier.type_travaux?.map((type) => {
                          const config = typeTravauxLabels[type]
                          if (!config) return null
                          const Icon = config.icon
                          return (
                            <span key={type} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.shortLabel}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                        <StatutIcon className="w-3 h-3" />
                        {statut.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/chantiers/${chantier.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(chantier)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(chantier.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">Aucun chantier</p>
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-primary hover:underline"
                  >
                    Créer le premier chantier
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom et Client */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Types de travaux */}
              <div>
                <label className="block text-sm font-medium mb-2">Type(s) de travaux *</label>
                <div className="flex gap-4">
                  {Object.entries(typeTravauxLabels).map(([key, config]) => {
                    const Icon = config.icon
                    const isSelected = formData.type_travaux.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTypeTravaux(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Adresse */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Numéro et rue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Complément</label>
                  <input
                    type="text"
                    value={formData.adresse_complement}
                    onChange={(e) => setFormData({ ...formData, adresse_complement: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Bâtiment, étage..."
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
              </div>

              {/* Infos bâtiment */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre d&apos;appartements</label>
                  <input
                    type="number"
                    value={formData.nb_appartements}
                    onChange={(e) => setFormData({ ...formData, nb_appartements: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de bâtiments</label>
                  <input
                    type="number"
                    value={formData.nb_batiments}
                    onChange={(e) => setFormData({ ...formData, nb_batiments: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Accès */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du gardien</label>
                  <input
                    type="text"
                    value={formData.gardien_nom}
                    onChange={(e) => setFormData({ ...formData, gardien_nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone gardien</label>
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
                    placeholder="Ex: A1234B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Infos d&apos;accès</label>
                  <input
                    type="text"
                    value={formData.acces_info}
                    onChange={(e) => setFormData({ ...formData, acces_info: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Ex: Clés chez gardien"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formData.type_travaux.length === 0}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {editingChantier ? 'Enregistrer' : 'Créer le chantier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
