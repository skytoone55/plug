'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building,
  MapPin,
  FileText,
  Droplets,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Phone,
  Key,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClientInfo {
  nom: string
}

interface ChantierDB {
  id: string
  nom: string
  adresse: string | null
  code_postal: string | null
  ville: string | null
  gardien_nom: string | null
  gardien_tel: string | null
  digicode: string | null
  acces_info: string | null
  nb_appartements: number | null
  type_travaux: string[] | null
  statut: string | null
  date_intervention: string | null
  clients_finaux?: ClientInfo | ClientInfo[] | null
}

interface Chantier {
  id: string
  nom: string
  adresse: string | null
  code_postal: string | null
  ville: string | null
  gardien_nom: string | null
  gardien_tel: string | null
  digicode: string | null
  acces_info: string | null
  nb_appartements: number | null
  type_travaux: string[] | null
  statut: string | null
  date_intervention: string | null
  clients_finaux?: ClientInfo | null
}

interface Rapport {
  id: string
  chantier_id: string
  statut: string | null
  type: 'equilibrage' | 'desembouage'
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_attente: { label: 'À faire', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Clock },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
}

export default function MesInterventionsPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [rapportsExistants, setRapportsExistants] = useState<Record<string, Rapport[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Récupérer les chantiers en_cours ou en_attente
      const { data: chantiersData } = await supabase
        .from('chantiers')
        .select(`
          *,
          clients_finaux (nom)
        `)
        .in('statut', ['en_attente', 'en_cours'])
        .order('created_at', { ascending: false })

      if (chantiersData) {
        // Normaliser les données (Supabase peut retourner un array ou un objet pour les relations)
        const normalizedChantiers: Chantier[] = (chantiersData as ChantierDB[]).map(c => ({
          ...c,
          clients_finaux: Array.isArray(c.clients_finaux) ? c.clients_finaux[0] : c.clients_finaux
        }))
        setChantiers(normalizedChantiers)

        // Récupérer les rapports existants pour ces chantiers
        const chantierIds = chantiersData.map(c => c.id)

        if (chantierIds.length > 0) {
          const [eqRes, desRes] = await Promise.all([
            supabase
              .from('rapports_equilibrage')
              .select('id, chantier_id, statut')
              .in('chantier_id', chantierIds),
            supabase
              .from('rapports_desembouage')
              .select('id, chantier_id, statut')
              .in('chantier_id', chantierIds),
          ])

          const rapportsMap: Record<string, Rapport[]> = {}

          eqRes.data?.forEach(r => {
            if (!rapportsMap[r.chantier_id]) rapportsMap[r.chantier_id] = []
            rapportsMap[r.chantier_id].push({ ...r, type: 'equilibrage' })
          })

          desRes.data?.forEach(r => {
            if (!rapportsMap[r.chantier_id]) rapportsMap[r.chantier_id] = []
            rapportsMap[r.chantier_id].push({ ...r, type: 'desembouage' })
          })

          setRapportsExistants(rapportsMap)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Interventions</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Liste des chantiers assignés */}
      <div className="grid gap-4">
        {chantiers.length > 0 ? (
          chantiers.map((chantier) => {
            const statut = statutConfig[chantier.statut || 'en_attente']
            const StatutIcon = statut.icon
            const rapports = rapportsExistants[chantier.id] || []

            return (
              <div key={chantier.id} className="bg-card rounded-xl border overflow-hidden">
                {/* Header avec statut */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${statut.color} border`}>
                  <div className="flex items-center gap-2">
                    <StatutIcon className="w-4 h-4" />
                    <span className="font-medium">{statut.label}</span>
                  </div>
                  {chantier.date_intervention && (
                    <span className="text-sm">
                      {new Date(chantier.date_intervention).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                {/* Contenu principal */}
                <div className="p-4">
                  {/* Nom du site et client (sans coordonnées) */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="w-5 h-5 text-primary" />
                        {chantier.nom}
                      </h3>
                      {chantier.clients_finaux && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          Client: {chantier.clients_finaux.nom}
                        </p>
                      )}
                    </div>
                    {chantier.nb_appartements && (
                      <span className="px-3 py-1 bg-muted rounded-lg text-sm font-medium">
                        {chantier.nb_appartements} lots
                      </span>
                    )}
                  </div>

                  {/* Adresse complète */}
                  <div className="flex items-start gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{chantier.adresse}</p>
                      <p className="text-sm text-muted-foreground">
                        {chantier.code_postal} {chantier.ville}
                      </p>
                    </div>
                  </div>

                  {/* Informations d'accès (gardien, digicode) */}
                  {(chantier.gardien_nom || chantier.digicode || chantier.acces_info) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Accès</p>
                      <div className="space-y-1">
                        {chantier.gardien_nom && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Gardien: {chantier.gardien_nom}
                            {chantier.gardien_tel && (
                              <a href={`tel:${chantier.gardien_tel}`} className="text-blue-600 hover:underline">
                                {chantier.gardien_tel}
                              </a>
                            )}
                          </p>
                        )}
                        {chantier.digicode && (
                          <p className="text-sm flex items-center gap-2">
                            <Key className="w-3 h-3" />
                            Digicode: <code className="bg-white px-2 py-0.5 rounded font-mono">{chantier.digicode}</code>
                          </p>
                        )}
                        {chantier.acces_info && (
                          <p className="text-sm text-muted-foreground">{chantier.acces_info}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Types de travaux et boutons pour créer les rapports */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Rapports à remplir :</p>
                    <div className="flex flex-wrap gap-2">
                      {chantier.type_travaux?.map((type) => {
                        const rapportExiste = rapports.find(r => r.type === type)
                        const isEquilibrage = type === 'equilibrage'

                        if (rapportExiste) {
                          // Rapport déjà créé - afficher le lien pour modifier
                          return (
                            <Link
                              key={type}
                              href={`/dashboard/${isEquilibrage ? 'rapport-form' : 'desembouage-form'}?id=${rapportExiste.id}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                rapportExiste.statut === 'pret' || rapportExiste.statut === 'livre'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isEquilibrage ? <FileText className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                              {isEquilibrage ? 'Équilibrage' : 'Désembouage'}
                              <CheckCircle className="w-4 h-4" />
                            </Link>
                          )
                        }

                        // Pas de rapport - bouton pour créer
                        return (
                          <Link
                            key={type}
                            href={`/dashboard/${isEquilibrage ? 'rapport-form' : 'desembouage-form'}?chantier_id=${chantier.id}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                              isEquilibrage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                            } transition-colors`}
                          >
                            <Plus className="w-4 h-4" />
                            {isEquilibrage ? 'Équilibrage' : 'Désembouage'}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">Aucune intervention prévue</p>
            <p className="text-sm text-muted-foreground mt-1">Vos chantiers assignés apparaîtront ici</p>
          </div>
        )}
      </div>
    </div>
  )
}
