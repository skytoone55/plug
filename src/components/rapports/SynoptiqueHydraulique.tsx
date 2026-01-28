'use client'

import type { MesureDebit } from '@/lib/types'

interface SynoptiqueHydrauliqueProps {
  mesures: MesureDebit[]
}

export default function SynoptiqueHydraulique({ mesures }: SynoptiqueHydrauliqueProps) {
  // Group measures by batimentNo
  const batiments = mesures.reduce((acc, m) => {
    const key = m.batimentNo || '1'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MesureDebit[]>)

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
                <span
                  style={{
                    position: 'absolute',
                    top: '156px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#333',
                  }}
                >
                  {vannes[0].reperage || '1'}
                </span>
              )}
            </div>

            {/* Additional columns for each subsequent valve */}
            {vannes.slice(1).map((vanne, index) => (
              <div key={vanne.id} style={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/chaufSchema.png"
                  alt={`Colonne ${index + 2}`}
                  style={{ height: '200px', display: 'inline' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '156px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#333',
                  }}
                >
                  {vanne.reperage || String(index + 2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
