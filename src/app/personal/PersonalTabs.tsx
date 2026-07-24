'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CustomAudioPlayer from './CustomAudioPlayer'
import DesignShowcase from './design/DesignShowcase'

const TABS = [
  { id: 'design', label: 'Design' },
  { id: 'music', label: 'Music' },
] as const

type TabId = (typeof TABS)[number]['id']

const FADE_MS = 280

/**
 * Both panels stay mounted and stacked, so a track keeps playing while you go
 * and turn a model over. The one you left is hidden rather than unmounted, but
 * only once its fade has finished — until then it has to stay visible, or the
 * fade has nothing to show. Hiding it afterwards is what keeps it out of the
 * tab order and off the accessibility tree.
 */
function panelStyle(selected: boolean, shown: boolean): React.CSSProperties {
  return {
    opacity: selected ? 1 : 0,
    visibility: shown ? 'visible' : 'hidden',
    transform: selected ? 'none' : 'translateY(8px)',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: selected ? 'ease-out' : 'ease-in',
    transitionDuration: `${FADE_MS}ms`,
  }
}

export default function PersonalTabs() {
  const [tab, setTab] = useState<TabId>('design')
  // Trails `tab` by one fade. While they differ, both panels are on screen.
  const [settled, setSettled] = useState<TabId>('design')
  const [heights, setHeights] = useState<Record<TabId, number>>({ design: 0, music: 0 })

  useEffect(() => {
    if (settled === tab) return
    const timer = setTimeout(() => setSettled(tab), FADE_MS + 20)
    return () => clearTimeout(timer)
  }, [tab, settled])

  const designRef = useRef<HTMLDivElement>(null)
  const musicRef = useRef<HTMLDivElement>(null)

  // The stacked panels are absolutely positioned, so the wrapper needs to be
  // told how tall the visible one is. Remeasured as either panel changes size.
  useLayoutEffect(() => {
    const measure = () =>
      setHeights({
        design: designRef.current?.offsetHeight ?? 0,
        music: musicRef.current?.offsetHeight ?? 0,
      })

    measure()
    const observer = new ResizeObserver(measure)
    if (designRef.current) observer.observe(designRef.current)
    if (musicRef.current) observer.observe(musicRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div>
      <div
        role="tablist"
        aria-label="Personal pursuits"
        className="mb-7 mx-auto flex w-64 gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
      >
        {TABS.map(({ id, label }) => {
          const selected = id === tab
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`relative flex-1 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                selected ? 'text-amber-200' : 'text-amber-100/55 hover:text-amber-100'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="personal-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-lg bg-amber-200/15"
                />
              )}
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>

      <motion.div
        className="relative"
        animate={{ height: heights[tab] || 'auto' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          ref={designRef}
          id="panel-design"
          role="tabpanel"
          aria-labelledby="tab-design"
          className="absolute inset-x-0 top-0"
          style={panelStyle(tab === 'design', tab === 'design' || settled === 'design')}
        >
          <DesignShowcase visible={tab === 'design'} />
        </div>

        <div
          ref={musicRef}
          id="panel-music"
          role="tabpanel"
          aria-labelledby="tab-music"
          className="absolute inset-x-0 top-0 mx-auto max-w-2xl"
          style={panelStyle(tab === 'music', tab === 'music' || settled === 'music')}
        >
          <CustomAudioPlayer />
        </div>
      </motion.div>
    </div>
  )
}
