'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface PhotoUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
  folder?: string
  label?: string
  maxPhotos?: number
}

export default function PhotoUpload({
  photos,
  onChange,
  folder = 'uploads',
  label = 'Photos',
  maxPhotos = 20,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newPhotos: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.url) {
          newPhotos.push(data.url)
        }
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onChange([...photos, ...newPhotos])
    setUploading(false)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">{label}</label>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-muted rounded-lg">
                {photos.length > 0 ? (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez pour ajouter des photos
              </p>
              <p className="text-xs text-muted-foreground">
                {photos.length}/{maxPhotos} photos
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
