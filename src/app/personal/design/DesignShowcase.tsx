'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { designModels } from './data'

const ModelStage = dynamic(() => import('./ModelStage'), { ssr: false })

const modelUrl = (slug: string) => `/models/${slug}.glb`

/** Warm the HTTP cache so switching models feels instant. */
const prefetched = new Set<string>()
function prefetch(slug: string) {
  const url = modelUrl(slug)
  if (prefetched.has(url)) return
  prefetched.add(url)
  fetch(url).catch(() => prefetched.delete(url))
}

export default function DesignShowcase({ visible = true }: { visible?: boolean }) {
  const [index, setIndex] = useState(0)
  // `spin` is what the toggle says; `grabbed` is the drag override. Taking hold
  // of a model stops the idle turn and leaves it stopped — picking another
  // model is what starts it going again.
  const [spin, setSpin] = useState(true)
  const [grabbed, setGrabbed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [inView, setInView] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const model = designModels[index]
  const autoRotate = spin && !grabbed

  // Don't pay for three.js until the section is actually approached, and let
  // the canvas idle once it scrolls back out of view.
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Respect a reduced-motion preference for the idle spin.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (query.matches) setSpin(false)
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const select = useCallback((next: number) => {
    setIndex(next)
    setResetKey((key) => key + 1)
    setGrabbed(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else stageRef.current?.requestFullscreen?.()
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight') select((index + 1) % designModels.length)
      else if (event.key === 'ArrowLeft')
        select((index - 1 + designModels.length) % designModels.length)
      else return
      event.preventDefault()
    },
    [index, select],
  )

  return (
    <section
      ref={sectionRef}
      id="design"
      className="scroll-mt-24"
      onKeyDown={onKeyDown}
    >
      <p data-peek className="mb-4 italic text-amber-100/80">
        Various designs I&apos;ve drawn and 3D-modeled.
      </p>

      <div className="space-y-5">
        {/* Stage */}
        <div
          ref={stageRef}
          data-peek
          className="card relative !p-0 overflow-hidden aspect-[5/4] bg-black/10"
        >
          {/* studio floor glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 62%, rgba(253,230,138,0.09), transparent 70%)',
            }}
          />

          {mounted ? (
            <ModelStage
              url={modelUrl(model.slug)}
              turns={model.turns}
              autoRotate={autoRotate}
              active={inView && visible}
              resetKey={resetKey}
              onUserInteract={() => setGrabbed(true)}
            />
          ) : (
            <div className="absolute inset-0" />
          )}

          {/* the model's name lives in the frame, so the frame reads on its own */}
          <div className="pointer-events-none absolute left-5 top-4 !rounded-none">
            <p className="text-xl font-semibold text-amber-200">{model.title}</p>
            <p className="text-xs tracking-wide text-amber-100/50">{model.category}</p>
          </div>

          <span className="pointer-events-none absolute right-4 top-3 font-mono text-[0.65rem] tracking-widest text-amber-100/30">
            {String(index + 1).padStart(2, '0')} / {String(designModels.length).padStart(2, '0')}
          </span>

          <span className="pointer-events-none absolute bottom-4 left-4 text-[0.7rem] tracking-wide text-amber-100/40">
            <span className="sm:hidden">Swipe sideways to rotate</span>
            <span className="hidden sm:inline">Drag to rotate · scroll to zoom</span>
          </span>

          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <StageButton
              label={autoRotate ? 'Stop rotation' : 'Start rotation'}
              active={autoRotate}
              onClick={() => {
                setSpin(!autoRotate)
                setGrabbed(false)
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M4 12a8 8 0 0113.7-5.7M20 12a8 8 0 01-13.7 5.7M18 3v4h-4M6 21v-4h4"
              />
            </StageButton>
            <StageButton label="Reset view" onClick={() => setResetKey((key) => key + 1)}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M12 4v4m0 8v4m8-8h-4M8 12H4m13.7-5.7l-2.8 2.8m-6.6 6.6l-2.8 2.8m12.2 0l-2.8-2.8M8.3 8.3L5.5 5.5"
              />
            </StageButton>
            <StageButton
              label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d={
                  fullscreen
                    ? 'M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5'
                    : 'M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5'
                }
              />
            </StageButton>
          </div>
        </div>

        {/* Index */}
        <nav
          aria-label="Models"
          data-peek
          className="grid gap-x-4 sm:grid-cols-2"
        >
          {designModels.map((entry, i) => {
            const selected = i === index
            return (
              <button
                key={entry.slug}
                type="button"
                onClick={() => select(i)}
                onMouseEnter={() => prefetch(entry.slug)}
                onFocus={() => prefetch(entry.slug)}
                aria-current={selected ? 'true' : undefined}
                className={`group flex min-w-0 items-center gap-3 border-b border-l-2 border-b-white/10 px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? 'border-l-amber-200 bg-amber-200/10 text-amber-200'
                    : 'border-l-transparent text-amber-100/70 hover:bg-white/5 hover:text-amber-100'
                }`}
              >
                <span
                  className={`font-mono text-[0.65rem] tabular-nums ${
                    selected ? 'text-amber-200/70' : 'text-amber-100/40'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.title}</span>
                <span className="text-[0.65rem] text-amber-100/40 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>{selected ? '●' : 'View'}</span>
              </button>
            )
          })}
        </nav>

        {/* Caption */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={model.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <h3 className="sr-only">{model.title}</h3>
              <p className="max-w-2xl text-amber-100/70">{model.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-white/10 px-2 py-1 text-xs text-amber-100/50">
                  {model.parts} {model.parts === 1 ? 'body' : 'bodies'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function StageButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg border p-1.5 backdrop-blur-sm transition-colors ${
        active
          ? 'border-amber-200/30 bg-amber-200/15 text-amber-200'
          : 'border-white/10 bg-black/20 text-amber-100/50 hover:border-white/20 hover:text-amber-100'
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
