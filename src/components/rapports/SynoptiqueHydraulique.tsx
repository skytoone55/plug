'use client'

import type { MesureDebit } from '@/lib/types'

interface SynoptiqueHydrauliqueProps {
  mesures: MesureDebit[]
}

export default function SynoptiqueHydraulique({ mesures }: SynoptiqueHydrauliqueProps) {
  // Build a global index map: for each mesure, store its global position (1-based)
  const globalIndexMap = new Map<string, number>()
  mesures.forEach((m, i) => {
    globalIndexMap.set(m.id, i + 1)
  })

  // Group measures by batimentNo
  const batiments = mesures.reduce((acc, m) => {
    const key = m.batimentNo || '1'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MesureDebit[]>)

  // Get label for a vanne: use reperage field, fallback to global index
  const getLabel = (vanne: MesureDebit) => {
    if (vanne.reperage && vanne.reperage.trim() !== '') return vanne.reperage
    return String(globalIndexMap.get(vanne.id) || '')
  }

  const labelStyle = {
    position: 'absolute' as const,
    top: '43%',  // Ajusté selon CDC - légèrement plus bas
    transform: 'translateX(-50%)',
    fontSize: '8px',
    fontWeight: 'bold' as const,
    color: '#333',
  }

  return (
    <div className="space-y-8">
      {Object.entries(batiments).map(([batimentNo, vannes]) => (
        <div key={batimentNo} className="space-y-3">
          <h4 className="font-semibold text-sm">Bâtiment {batimentNo}</h4>
          <div className="synoptique-container" style={{ position: 'relative', display: 'inline-flex', flexWrap: 'wrap' }}>
            {/* Base schema - first column with pump */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/baseSchema.png"
                alt="Colonne principale"
                style={{ height: '200px', display: 'inline' }}
              />
              {vannes.length > 0 && (
                <span style={{ ...labelStyle, left: '18%' }}>
                  {getLabel(vannes[0])}
                </span>
              )}
            </div>

            {/* Additional columns for each subsequent valve */}
            {vannes.slice(1).map((vanne) => (
              <div key={vanne.id} style={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/chaufSchema.png"
                  alt={`Colonne ${getLabel(vanne)}`}
                  style={{ height: '200px', display: 'inline' }}
                />
                <span style={{ ...labelStyle, left: '-10%' }}>
                  {getLabel(vanne)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
