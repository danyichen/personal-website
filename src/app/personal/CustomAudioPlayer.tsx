'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './progressbar.module.css'

const TRACKS = [
  { title: 'Sunset Drive', src: '/music/sunset-drive.mp3' },
  { title: 'Midnight Memories', src: '/music/midnight-memories.mp3' },
  { title: 'Borrowed Time', src: '/music/borrowed-time.mp3' },
  { title: 'Polaroid Summer', src: '/music/polaroid-summer.mp3' },
]

function formatTime(s: number) {
  if (isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function TrackProgressBar({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement> }) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress(audio.currentTime)
    const setDur = () => setDuration(audio.duration || 0)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('durationchange', setDur)
    setDur()
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('durationchange', setDur)
    }
  }, [audioRef])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Number(e.target.value)
    setProgress(Number(e.target.value))
  }

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.01}
        value={progress}
        onChange={handleSeek}
        aria-label="Seek"
        style={{ ['--played' as any]: `${duration ? (progress / duration) * 100 : 0}%` }}
        className={styles.progressBar}
      />
      <div className="mt-1 flex justify-between text-xs tabular-nums text-amber-100/60">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

/** Three little bars that bounce while a track is the one playing. */
function NowPlayingTicks() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2px] origin-bottom rounded-full bg-amber-200"
          style={{ height: '100%', animation: `eq-bounce 0.9s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  )
}

export default function PersonalAudioPlayer() {
  const [trackIdx, setTrackIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [canvasBox, setCanvasBox] = useState({ w: 0, h: 0 })

  // The Web Audio graph is built once, on the first play, and reused. Rebuilding
  // it — as the old code did every time playback started — throws, since an
  // element can only ever back a single MediaElementSource.
  const ensureGraph = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx: AudioContext = new Ctx()
    const source = ctx.createMediaElementSource(audioRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    analyserRef.current = analyser
  }, [])

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close()
    }
  }, [])

  // Starts the current source, waiting for it to be playable first — a freshly
  // swapped src isn't ready in the same tick, and calling play() early aborts
  // with "interrupted by a new load request."
  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    ensureGraph()
    audioCtxRef.current?.resume()
    const begin = () => audio.play().then(() => setIsPlaying(true)).catch(() => {})
    if (audio.readyState >= 2) begin()
    else audio.addEventListener('canplay', begin, { once: true })
  }, [ensureGraph])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
  }, [])

  // Selecting a track swaps the source imperatively so playback can begin from
  // the same click gesture (a state-driven src update lands a render too late).
  // A new src resets playback to the start on its own.
  const selectTrack = useCallback(
    (idx: number, autoplay: boolean) => {
      const audio = audioRef.current
      if (!audio) return
      audio.src = TRACKS[idx].src
      setTrackIdx(idx)
      if (autoplay) play()
      else setIsPlaying(false)
    },
    [play],
  )

  const step = useCallback(
    (delta: number) => selectTrack((trackIdx + delta + TRACKS.length) % TRACKS.length, isPlaying),
    [trackIdx, isPlaying, selectTrack],
  )

  // Keep the canvas sized to its box in device pixels for a crisp visualiser.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      setCanvasBox({ w: Math.round(rect.width * dpr), h: Math.round(rect.height * dpr) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // The visualiser. Runs a frame loop while playing; otherwise paints a calm
  // resting waveform so the panel never looks broken.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || canvasBox.w === 0) return

    canvas.width = canvasBox.w
    canvas.height = canvasBox.h
    const { w, h } = canvasBox
    const dpr = window.devicePixelRatio || 1

    const analyser = analyserRef.current
    const bins = analyser?.frequencyBinCount ?? 32
    const data = new Uint8Array(bins)
    const mid = Math.floor(bins / 2)
    const slot = w / (mid * 2)
    const barW = Math.max(slot * 0.5, 2 * dpr)

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#c7d3c4')
    gradient.addColorStop(1, '#849483')

    // A gentle static silhouette for the resting state.
    const idle = Array.from({ length: mid }, (_, i) => 0.14 + 0.1 * Math.sin(i * 0.7))

    let raf = 0

    const bar = (x: number, height: number) => {
      const y = (h - height) / 2
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, barW, height, barW / 2)
      else ctx.rect(x, y, barW, height)
      ctx.fill()
    }

    const render = (live: Uint8Array | null) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = gradient
      for (let i = 0; i < mid; i++) {
        const level = live ? live[i] / 255 : idle[i]
        const height = Math.max(barW, level * h * 0.82)
        bar(w / 2 + i * slot + (slot - barW) / 2, height)
        bar(w / 2 - (i + 1) * slot + (slot - barW) / 2, height)
      }
    }

    if (isPlaying && analyser) {
      const loop = () => {
        analyser.getByteFrequencyData(data)
        render(data)
        raf = requestAnimationFrame(loop)
      }
      loop()
    } else {
      render(null)
    }

    return () => cancelAnimationFrame(raf)
  }, [isPlaying, canvasBox])

  return (
    <section aria-label="Music" className="w-full">
      <p className="mb-6 text-amber-100/80 italic text-center">
        A selection of instrumentals that I&apos;ve made
      </p>

      <audio ref={audioRef} src={TRACKS[trackIdx].src} preload="auto" onEnded={() => setIsPlaying(false)} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* Now playing */}
        <div className="card relative !p-0 overflow-hidden bg-black/10 flex min-h-[420px] flex-col sm:min-h-[460px] lg:col-start-1 lg:row-start-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 60%, rgba(253,230,138,0.09), transparent 70%)',
            }}
          />
          <span className="pointer-events-none absolute right-4 top-3 font-mono text-[0.65rem] tracking-widest text-amber-100/30">
            {String(trackIdx + 1).padStart(2, '0')} / {String(TRACKS.length).padStart(2, '0')}
          </span>

          <div className="relative flex flex-1 flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <div className="text-[0.7rem] uppercase tracking-[0.2em] text-amber-100/45">
                Now Playing
              </div>
              <AnimatePresence mode="wait">
                <motion.h3
                  key={trackIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22 }}
                  className="mt-1 text-2xl font-bold text-amber-200"
                >
                  {TRACKS[trackIdx].title}
                </motion.h3>
              </AnimatePresence>
            </div>

            <div className="flex flex-1 items-center">
              <canvas ref={canvasRef} className="h-24 w-full sm:h-28" />
            </div>

            <div className="flex flex-col gap-5">
              <TrackProgressBar audioRef={audioRef} />

              <div className="flex items-center justify-center gap-3">
                <TransportButton label="Previous track" onClick={() => step(-1)}>
                  <path d="M7 6h2v12H7z" />
                  <path d="M20 6.5v11a1 1 0 01-1.53.85l-8.5-5.5a1 1 0 010-1.7l8.5-5.5A1 1 0 0120 6.5z" />
                </TransportButton>

                <button
                  type="button"
                  onClick={isPlaying ? pause : play}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#849483] text-white shadow transition-colors hover:bg-[#AAB8A7]"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.svg
                      key={isPlaying ? 'pause' : 'play'}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      {isPlaying ? (
                        <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                      ) : (
                        <path d="M8 5.14v13.72a1 1 0 001.54.84l10.5-6.86a1 1 0 000-1.68L9.54 4.3A1 1 0 008 5.14z" />
                      )}
                    </motion.svg>
                  </AnimatePresence>
                </button>

                <TransportButton label="Next track" onClick={() => step(1)}>
                  <path d="M15 6h2v12h-2z" />
                  <path d="M4 6.5v11a1 1 0 001.53.85l8.5-5.5a1 1 0 000-1.7l-8.5-5.5A1 1 0 004 6.5z" />
                </TransportButton>

                <TransportButton label="Stop" onClick={stop}>
                  <rect x="7" y="7" width="10" height="10" rx="1.5" />
                </TransportButton>
              </div>
            </div>
          </div>
        </div>

        {/* Track index */}
        <nav
          aria-label="Tracks"
          className="flex gap-2 overflow-x-auto pb-1 lg:col-start-2 lg:row-start-1 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {TRACKS.map((track, i) => {
            const selected = i === trackIdx
            return (
              <button
                key={track.title}
                type="button"
                onClick={() => selectTrack(i, true)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                aria-current={selected ? 'true' : undefined}
                className={`group flex shrink-0 items-center gap-3 px-3 py-2.5 text-left transition-colors lg:w-full ${
                  selected
                    ? 'bg-amber-200/10 text-amber-200'
                    : 'text-amber-100/60 hover:bg-white/5 hover:text-amber-100'
                }`}
              >
                <span
                  className={`font-mono text-[0.65rem] tabular-nums ${
                    selected ? 'text-amber-200/70' : 'text-amber-100/25'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{track.title}</span>
                {selected && isPlaying ? (
                  <NowPlayingTicks />
                ) : (
                  (selected || hoverIdx === i) && (
                    <span className="text-[0.65rem] text-amber-100/40" aria-hidden>
                      ▶
                    </span>
                  )
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </section>
  )
}

function TransportButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-amber-100/60 transition-colors hover:border-white/20 hover:text-amber-100"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
