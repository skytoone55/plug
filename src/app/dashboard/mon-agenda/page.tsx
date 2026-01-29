'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Intervention {
  id: string
  numero_dossier: string | null
  type: 'equilibrage' | 'desembouage' | 'maintenance'
  statut: string
  date_planifiee: string | null
  heure_debut: string | null
  heure_fin: string | null
  chantiers?: {
    nom: string
    adresse: string | null
    ville: string | null
    code_postal: string | null
    gardien_nom: string | null
    gardien_tel: string | null
    digicode: string | null
    acces_info: string | null
    clients_finaux?: { nom: string }
  }
}

const typeColors: Record<string, string> = {
  equilibrage: 'bg-blue-500',
  desembouage: 'bg-orange-500',
  maintenance: 'bg-gray-500',
}

const typeLabels: Record<string, string> = {
  equilibrage: 'Équilibrage',
  desembouage: 'Désembouage',
  maintenance: 'Maintenance',
}

export default function MonAgendaPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [technicienId, setTechnicienId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Récupérer l'ID technicien lié à cet utilisateur
        const { data: technicien } = await supabase
          .from('techniciens')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (technicien) {
          setTechnicienId(technicien.id)
          fetchInterventions(technicien.id)
        } else {
          setLoading(false)
        }
      }
    }
    init()
  }, [])

  const fetchInterventions = async (techId: string) => {
    const res = await fetch(`/api/interventions?technicien_id=${techId}`)
    const data = await res.json()
    setInterventions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // Fonctions calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Jours du mois précédent
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, currentMonth: false })
    }

    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true })
    }

    // Jours du mois suivant
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false })
    }

    return days
  }

  const getInterventionsForDate = (date: Date) => {
    return interventions.filter(int => {
      if (!int.date_planifiee) return false
      const intDate = new Date(int.date_planifiee)
      return intDate.toDateString() === date.toDateString()
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Interventions du jour sélectionné ou aujourd'hui
  const [selectedDate, setSelectedDate] = useState(new Date())
  const selectedInterventions = getInterventionsForDate(selectedDate)

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!technicienId) {
    return (
      <div className="p-6 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg">Profil technicien non configuré</p>
        <p className="text-sm text-muted-foreground">Contactez un administrateur</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon Agenda</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {days.map(({ date, currentMonth }, idx) => {
              const dayInterventions = getInterventionsForDate(date)
              const isSelected = date.toDateString() === selectedDate.toDateString()

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    relative p-2 min-h-[60px] rounded-lg text-sm transition-colors
                    ${currentMonth ? '' : 'text-muted-foreground/50'}
                    ${isToday(date) ? 'bg-primary/10 font-bold' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted'}
                  `}
                >
                  <span className="block">{date.getDate()}</span>
                  {dayInterventions.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {dayInterventions.slice(0, 3).map((int, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${typeColors[int.type]}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Détails du jour */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold mb-4">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {selectedInterventions.length > 0 ? (
            <div className="space-y-4">
              {selectedInterventions.map((int) => (
                <Link
                  key={int.id}
                  href={`/dashboard/mes-interventions?id=${int.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${typeColors[int.type]}`} />
                    <span className="font-medium text-sm">{typeLabels[int.type]}</span>
                    {int.heure_debut && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {int.heure_debut.slice(0, 5)}
                      </span>
                    )}
                  </div>

                  <p className="font-medium">{int.chantiers?.nom}</p>
                  {int.chantiers?.ville && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {int.chantiers.ville}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune intervention ce jour</p>
          )}
        </div>
      </div>
    </div>
  )
}
