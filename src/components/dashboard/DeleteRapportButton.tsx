'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteRapportButtonProps {
  id: string
  table: 'rapports_equilibrage' | 'rapports_desembouage'
}

export default function DeleteRapportButton({ id, table }: DeleteRapportButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return

    setLoading(true)
    try {
      const endpoint = table === 'rapports_equilibrage'
        ? '/api/rapports/equilibrage'
        : '/api/rapports/desembouage'

      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
      title="Supprimer"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
