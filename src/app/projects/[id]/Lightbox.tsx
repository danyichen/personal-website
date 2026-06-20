"use client"

import { useEffect, useCallback } from 'react'
import Image from 'next/image'

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface LightboxProps {
  images: GalleryImage[];
  selectedIndex: number;
  setSelectedIndex: (index: number | null) => void;
}

export default function Lightbox({ images, selectedIndex, setSelectedIndex }: LightboxProps) {
  const handlePrev = useCallback(() => {
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }, [selectedIndex, images.length, setSelectedIndex])

  const handleNext = useCallback(() => {
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }, [selectedIndex, images.length, setSelectedIndex])

  const handleClose = useCallback(() => {
    setSelectedIndex(null)
  }, [setSelectedIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, handlePrev, handleNext])

  // Prevent scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-default" onClick={handleClose} />

      {/* Close button */}
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full z-50"
        aria-label="Close preview"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Nav buttons (only if more than 1 image) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-white/10 hover:bg-white/20 rounded-full z-50"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-white/10 hover:bg-white/20 rounded-full z-50"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image Container */}
      <div className="relative w-full max-w-5xl h-[75vh] flex flex-col items-center justify-center z-40">
        <div className="relative w-full h-[65vh]">
          <Image
            src={images[selectedIndex].src}
            alt={images[selectedIndex].alt}
            fill
            className="object-contain transition-all duration-300"
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />
        </div>
        
        {/* Caption */}
        <div className="mt-4 max-w-3xl text-center px-4">
          <p className="text-amber-200 text-lg font-sans italic">{images[selectedIndex].caption}</p>
          {images.length > 1 && (
            <p className="text-white/40 text-xs mt-1.5 font-sans">
              {selectedIndex + 1} of {images.length}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
