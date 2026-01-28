'use client'

import { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { RotateCcw } from 'lucide-react'

interface SignatureFieldProps {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
}

export default function SignatureField({ label, value, onChange }: SignatureFieldProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (value && sigRef.current) {
      sigRef.current.fromDataURL(value)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnd = () => {
    if (sigRef.current) {
      const dataUrl = sigRef.current.toDataURL()
      onChange(dataUrl)
    }
  }

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear()
      onChange(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Effacer
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleEnd}
          penColor="black"
          canvasProps={{
            className: 'w-full',
            style: { width: '100%', height: '150px' },
          }}
        />
      </div>
    </div>
  )
}
