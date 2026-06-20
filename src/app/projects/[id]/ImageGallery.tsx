"use client"

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Lazy load the Lightbox component so it's not in the initial JS bundle
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false })

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <h3 className="text-xl font-bold text-amber-200 mb-6 font-sans">Project Gallery</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((img, index) => (
          <div 
            key={index} 
            onClick={() => setSelectedIndex(index)}
            className="flex flex-col bg-white/5 rounded-2xl overflow-hidden border border-white/10 group hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer"
          >
            <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-custom-brown/50">
              <Image 
                src={img.src} 
                alt={img.alt} 
                fill 
                priority={index < 4}
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4 bg-custom-brown/40 backdrop-blur-sm border-t border-white/5 flex-grow flex items-center justify-center">
              <p className="text-amber-100/90 text-sm italic text-center font-sans">{img.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <Lightbox 
          images={images} 
          selectedIndex={selectedIndex} 
          setSelectedIndex={setSelectedIndex} 
        />
      )}
    </div>
  )
}
