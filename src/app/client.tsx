'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'publications', label: 'Publications' },
  { id: 'personal', label: 'Personal' },
  { id: 'contact', label: 'Contact' },
]

export function Nav() {
  const [active, setActive] = useState<string | null>(null)

  // Scroll-spy: whichever section crosses the middle band of the viewport is current.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <header className="sticky top-0 z-10 backdrop-blur-sm bg-custom-brown/80 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center md:justify-between min-h-16 py-2">
        <Link href="/#top" className="hidden md:inline text-lg font-semibold text-amber-200 hover:text-amber-100 transition-colors">
          Will Chen
        </Link>
        <nav className="flex justify-center gap-x-4 sm:gap-x-8">
          {LINKS.map(({ id, label }) => (
            <Link
              key={id}
              href={`/#${id}`}
              aria-current={active === id ? 'location' : undefined}
              className={`relative py-1 text-[15px] sm:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${
                active === id ? 'text-amber-200' : 'text-white/80 hover:text-amber-200'
              }`}
            >
              {label}
              {active === id && (
                <motion.span
                  layoutId="nav-underline"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-x-0 -bottom-0.5 h-px bg-amber-200 !rounded-none"
                />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}


export function OnlyHome({ children }: { children: React.ReactNode }) {
  return usePathname() === '/' ? <>{children}</> : null
}

/* Nav and footer belong to the detail pages; the home page is a single stage. */
export function NotHome({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return path === '/' || (path === '/m' || path.startsWith('/m/')) ? null : <>{children}</>
}

// bare: the blade shows only the page's title, not its content.
export type Place = { id: string; title: string; caption: string; content: React.ReactNode; bare?: boolean; zoom?: number; pin?: 'left' | 'right' | 'up' }

/* ---------- the iris ----------
   The whole screen is a five-blade camera iris with the round portrait in its
   opening. Every blade is cut from its own page, shrunk to fill the blade, and
   the pages with the most to show get the biggest blades.
   Choosing a section is one shot of the shutter: the blades accelerate shut over
   the hero, stop dead, and reopen on that section as it floods the screen.
   The movement is strictly mechanical (eased, no overshoot); the fluid part is
   in the drawing: blade edges bow like thin metal under speed and straighten
   out as they come to rest. One rAF loop writes it all and sleeps when still. */

type Pt = [number, number]
type Tween = { x: number; from: number; to: number; t0: number; dur: number; ease: (p: number) => number }
const TAU = Math.PI * 2
const inCubic = (p: number) => p * p * p
const outCubic = (p: number) => 1 - (1 - p) ** 3
const outQuart = (p: number) => 1 - (1 - p) ** 4
const tween = (x: number): Tween => ({ x, from: x, to: x, t0: 0, dur: 1, ease: outCubic })

// The part of a polygon that is on screen (Sutherland-Hodgman against the screen rectangle).
function onScreen(p: Pt[], W: number, H: number): Pt[] {
  for (const f of [(q: Pt) => q[0], (q: Pt) => W - q[0], (q: Pt) => q[1], (q: Pt) => H - q[1]]) {
    const out: Pt[] = []
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length], fa = f(a), fb = f(b)
      if (fa >= 0) out.push(a)
      if (fa >= 0 !== fb >= 0) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
    })
    p = out
    if (!p.length) break
  }
  return p
}
function shape(p: Pt[]) {
  let A = 0, x = 0, y = 0
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length], c = a[0] * b[1] - b[0] * a[1]
    A += c; x += (a[0] + b[0]) * c; y += (a[1] + b[1]) * c
  })
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1])
  return {
    area: Math.abs(A / 2), C: (A ? [x / (3 * A), y / (3 * A)] : p[0] ?? [0, 0]) as Pt,
    w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
  }
}
const f1 = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
const wrap = (a: number) => a - TAU * Math.round(a / TAU) // an angle brought into -π..π

// Which pages show best on a sliver, best first: pictures, then lists, then a few words.
const SLIVER = ['projects', 'personal', 'publications', 'contact', 'about']

export function Stage({ intro, places }: { intro: React.ReactNode; places: Place[] }) {
  const [open, setOpen] = useState(-1)
  const [atTop, setAtTop] = useState(true) // the home button shows only at the top of a page
  const [size, setSize] = useState({ W: 0, H: 0 })
  const sheets = useRef<(HTMLElement | null)[]>([])
  const pages = useRef<(HTMLDivElement | null)[]>([])
  const headings = useRef<(HTMLHeadingElement | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const glass = useRef<(HTMLDivElement | null)[]>([])
  const blades = useRef<(SVGPathElement | null)[]>([])
  const hero = useRef<HTMLDivElement | null>(null)
  const engine = useRef<{ aim: (g: number) => void; hover: (g: number) => void } | null>(null)
  const openRef = useRef(-1)
  openRef.current = open

  // URL hash is the source of truth: /#projects opens a section.
  useEffect(() => {
    const sync = () => setOpen(places.findIndex((p) => p.id === location.hash.slice(1)))
    sync()
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [places])

  useEffect(() => {
    // The stage takes the screen above the footer, so the home page doesn't scroll.
    // clientWidth/Height leave out a scrollbar; the footer's height can change once the font loads,
    // so it is watched too, or the blades (px) and their edges (svg) drift apart.
    const foot = document.querySelector<HTMLElement>('body > footer')
    const on = () => setSize((s) => {
      const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight - (foot?.offsetHeight ?? 0)
      return s.W === W && s.H === H ? s : { W, H }
    })
    on(); addEventListener('resize', on)
    const ro = new ResizeObserver(on)
    if (foot) ro.observe(foot)
    document.fonts?.ready.then(on)
    return () => { removeEventListener('resize', on); ro.disconnect() }
  }, [])

  const go = (g: number) => {
    if (g < 0) { history.pushState(null, '', '/'); setOpen(-1) }
    else location.hash = places[g].id
  }

  const { W, H } = size, tall = H > W
  const cx = W / 2, cy = tall ? H * 0.45 : H / 2
  const r0 = tall ? Math.min(W * 0.62, H * 0.3) : Math.min(H * 0.5, W * 0.34)
  const D = 2 * r0 * Math.cos(Math.PI / 5) // the portrait fills the circle inside the opening

  useEffect(() => {
    if (!W) return
    const N = places.length, Hd = Math.hypot(W, H), far = Hd * 3
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const first = !engine.current
    const out = (Hd / 2 / Math.cos(Math.PI / N) / r0) * 1.08 // wide enough that every blade has left the screen
    // With a page open, each other section keeps a small triangle in a screen corner, all four the
    // same size, to jump straight to it. It grows in from the corner as the blades leave.
    const CX = Math.min(200, W * 0.13), CY = Math.min(160, H * 0.18), TABS = 0.85
    const rho = tween(first && openRef.current < 0 && !reduced ? 0 : 1) // the opening, as a fraction of r0
    const swell = tween(0), tabT = tween(0), lift = places.map(() => tween(0))
    let scene = -1, next = -1, shutting = false, hold = 0, raf = 0, last = 0, prev = rho.x, bend = 0, wave = 0
    const set = (t: Tween, to: number, dur: number, ease: (p: number) => number) => {
      t.from = t.x; t.to = to; t.t0 = performance.now(); t.dur = reduced ? 1 : dur; t.ease = ease
    }

    const th0 = -Math.PI / 2
    const verts = (r: number, th: number): Pt[] =>
      places.map((_, k) => [cx + r * Math.cos(th + (k * TAU) / N), cy + r * Math.sin(th + (k * TAU) / N)])
    // Edge k's direction for the pentagon, from the turn alone (so it holds even when shut).
    const dirsP = (th: number) => places.map((_, k) => th + ((k + 0.5) * TAU) / N + Math.PI / 2)
    // Blade k lies outside edge k of the opening, between that edge and the previous edge carried on.
    // A[k] is the direction edge k carries on in.
    const flat = (V: Pt[], A: number[], k: number): Pt[] => {
      const a = V[k], b = V[(k + 1) % N], au = A[k], ap = A[(k + N - 1) % N]
      return [a, b, [b[0] + far * Math.cos(au), b[1] + far * Math.sin(au)], [a[0] + far * Math.cos(ap), a[1] + far * Math.sin(ap)]]
    }
    // The same blade drawn as if the metal were liquid while it moves: each long edge sags
    // sideways under speed with a ripple running out along it, and the short edge facing the
    // opening swells and ripples too. At rest every edge is straight again.
    const ray = (V: Pt[], A: number[], k: number) => {
      k %= N
      const o = V[(k + 1) % N], a = A[k], u: Pt = [Math.cos(a), Math.sin(a)], n: Pt = [-u[1], u[0]]
      const sag = bend * Hd * 0.3, rip = Math.abs(bend) * Hd * 0.03, P: Pt[] = []
      for (let i = 0; i <= 16; i++) {
        const v = i / 16, env = Math.sin(Math.PI * v), off = sag * env + rip * env * Math.sin(v * 5 * Math.PI - wave + k) // same phase from both blades that share this edge
        P.push([o[0] + u[0] * Hd * v + n[0] * off, o[1] + u[1] * Hd * v + n[1] * off])
      }
      P.push([o[0] + u[0] * far, o[1] + u[1] * far])
      return P
    }
    const curved = (V: Pt[], A: number[], k: number) => {
      const a = V[k], b = V[(k + 1) % N], ang = A[k] - Math.PI / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1])
      // sized as on the home iris, however long the edge gets, so it never bows past the corners
      const cap = Math.min(len, r0), bow = Math.abs(bend) * cap * 0.5, rip = Math.abs(bend) * cap * 0.06, E: Pt[] = []
      for (let i = 0; i <= 10; i++) {
        const v = i / 10, env = Math.sin(Math.PI * v), off = bow * env + rip * env * Math.sin(v * 3 * Math.PI + wave * 1.3 + k)
        E.push([a[0] + (b[0] - a[0]) * v + Math.cos(ang) * off, a[1] + (b[1] - a[1]) * v + Math.sin(ang) * off])
      }
      return [...E, ...ray(V, A, k), ...ray(V, A, k - 1 + N).reverse()]
    }
    const path = (P: Pt[]) => `M${P.map(f1).join('L')}Z`

    // Seat the pages: the biggest visible blades go to the pages that show best on a sliver.
    const V0 = verts(r0, th0)
    const room = places.map((_, k) => onScreen(flat(V0, dirsP(th0), k), W, H))
    // seated by the blades' sizes at the original, smaller opening, so each section keeps its place
    const Vs = verts(tall ? r0 : Math.min(H * 0.45, W * 0.32), th0), seatRoom = places.map((_, k) => shape(onScreen(flat(Vs, dirsP(th0), k), W, H)).area)
    const bySize = room.map((_, k) => k).sort((a, b) => seatRoom[b] - seatRoom[a])
    const rank = (g: number) => { const i = SLIVER.indexOf(places[g].id); return i < 0 ? 99 : i }
    const slot: number[] = []
    places.map((_, g) => g).sort((a, b) => rank(a) - rank(b)).forEach((g, i) => { slot[g] = bySize[i] })

    // The biggest box of aspect a (plus a band of L px on top for the label) that fits inside
    // the blade's visible part, which is convex, so a box is inside when its corners are.
    const fit = (P: Pt[], a: number, L: number, m = 18) => {
      const C = shape(P).C
      const E = P.map((p, i) => {
        const q = P[(i + 1) % P.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
        let n: Pt = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l], d = n[0] * p[0] + n[1] * p[1]
        if (n[0] * C[0] + n[1] * C[1] > d) { n = [-n[0], -n[1]]; d = -d }
        return { n, d: d - m }
      })
      const xs = P.map((q) => q[0]), ys = P.map((q) => q[1])
      let best = { c: C, hw: 0 }
      for (let i = 1; i < 40; i++) for (let j = 1; j < 40; j++) {
        const c: Pt = [Math.min(...xs) + ((Math.max(...xs) - Math.min(...xs)) * i) / 40, Math.min(...ys) + ((Math.max(...ys) - Math.min(...ys)) * j) / 40]
        let hw = Infinity
        for (const { n, d } of E) hw = Math.min(hw, (d - n[0] * c[0] - n[1] * c[1] - (L / 2) * Math.abs(n[1])) / (Math.abs(n[0]) + Math.abs(n[1]) / a))
        if (hw > best.hw) best = { c, hw }
      }
      return best
    }
    // Each page shows the part marked data-peek, as large as its blade allows, under its label.
    // Every label is the same size; the real heading only appears once the page is open.
    type Rest = { s: number; x: number; y: number; ox: number; oy: number; lx: number; ly: number; lw: number; lh: number }
    const rest: Rest[] = []
    const measure = (g: number) => {
      const pg = pages.current[g], lb = labels.current[g]
      if (!pg || !lb) return
      const P = room[slot[g]], lw = lb.offsetWidth, lh = lb.offsetHeight
      const marked = [...pg.querySelectorAll<HTMLElement>('[data-peek]')]
      if (places[g].bare || !marked.length) {
        const { c } = fit(P, lw / lh, 0)
        rest[g] = { s: 0.5, x: W, y: H, ox: 0, oy: 0, lx: c[0] - lw / 2, ly: c[1] - lh / 2, lw, lh }
        return
      }
      const keep = pg.style.transform
      pg.style.transform = 'none'
      const o = pg.getBoundingClientRect(), rg = document.createRange()
      // the extent of what's actually drawn, not the full-width blocks it sits in
      const R = marked.map((e) => { rg.selectNodeContents(e); return rg.getBoundingClientRect() })
      pg.style.transform = keep
      const x0 = Math.min(...R.map((r) => r.left)) - o.left, y0 = Math.min(...R.map((r) => r.top)) - o.top + pg.scrollTop
      const w = Math.max(...R.map((r) => r.right)) - o.left - x0, h = Math.max(...R.map((r) => r.bottom)) - o.top + pg.scrollTop - y0
      const band = lh + 14 // the label, and a little air below it
      const { c, hw } = fit(P, w / h, band)
      // too small to read: keep a readable size, pinned at the top-left, and let the blade crop the rest
      const fits = (2 * hw) / w, sc = Math.max(places[g].zoom ?? 0.34, Math.min(0.7, fits))
      let top = fits < sc ? c[1] - hw / (w / h) - band / 2 : c[1] - (sc * h + band) / 2
      let left = fits >= sc ? c[0] - (sc * w) / 2 : places[g].pin === 'right' ? c[0] + hw - sc * w : c[0] - hw
      // pinned right: tucked into the screen's top right, where a top-right blade is widest
      let lx = c[0] - lw / 2
      if (places[g].pin === 'right') { left = W - 28 - sc * w; top = 22; lx = left + (sc * w - lw) / 2 }
      // pinned up: same size and place across, but centred on the blade's height instead of its middle of mass
      if (places[g].pin === 'up') { const ys = P.map((q) => q[1]); top = Math.max(22, (Math.min(...ys) + Math.max(...ys)) / 2 - (sc * h + band) / 2 + 140) }
      // pinned left: up into the blade's top, against its left edge, the label over the open width
      if (places[g].pin === 'left') {
        // where a horizontal line at y crosses the blade
        const span = (y: number) => {
          const xs: number[] = []
          P.forEach((p, i) => { const q = P[(i + 1) % P.length]; if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + ((y - p[1]) * (q[0] - p[0])) / (q[1] - p[1])) })
          return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, W]
        }
        top = 22
        left = span(top + band + sc * h * 0.55)[0] + 14
        const [a, b] = span(top + lh / 2)
        lx = (a + b) / 2 - lw / 2
      }
      lx = Math.min(Math.max(lx, 10), W - lw - 10) // never off the screen
      rest[g] = { s: sc, x: left - sc * x0, y: top + band - sc * y0, ox: x0 + w / 2, oy: y0, lx, ly: top, lw, lh }
    }
    places.forEach((_, g) => measure(g))
    // pages that load more content later (the 3D models, the music) are measured again
    // For each page that can be open: which corner each other blade goes to (the corner nearest
    // where it rests, matched one to one), that corner's triangle, and the label's place in it.
    const corners: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]], restC = room.map((q) => shape(q).C)
    const dock = places.map((_, ks) => {
      const others = places.map((_, k) => k).filter((k) => k !== ks)
      let perm = [0, 1, 2, 3], cost = Infinity
      const permute = (a: number[], i: number) => {
        if (i === a.length) {
          const c = a.reduce((t, cn, j) => t + Math.hypot(restC[others[j]][0] - corners[cn][0], restC[others[j]][1] - corners[cn][1]), 0)
          if (c < cost) { cost = c; perm = a.slice() }
          return
        }
        for (let j = i; j < a.length; j++) { [a[i], a[j]] = [a[j], a[i]]; permute(a, i + 1); [a[i], a[j]] = [a[j], a[i]] }
      }
      permute([0, 1, 2, 3], 0)
      const tri: Pt[][] = [], L: { c: Pt; s: number }[] = []
      others.forEach((k, j) => {
        const [qx, qy] = corners[perm[j]], sx = qx ? -1 : 1, sy = qy ? -1 : 1, o: Pt = [qx - sx * 2, qy - sy * 2]
        tri[k] = [o, [qx + sx * CX, o[1]], [o[0], qy + sy * CY]]
        const lb = labels.current[slot.indexOf(k)], m = 12
        const lw = lb?.offsetWidth ?? 200, lh = lb?.offsetHeight ?? 50
        const sc = Math.min(TABS, (1 - m / CX - m / CY) / (lw / CX + lh / CY)), w = lw * sc, h = lh * sc
        L[k] = { c: [qx + sx * (m + w / 2), qy + sy * (m + h / 2)], s: sc }
      })
      return { tri, L }
    })
    const home = (r: number) => { const th = th0 + 0.95 * (1 - r); return { V: verts(r * r0, th), A: dirsP(th) } }

    const ro = new ResizeObserver((es) => es.forEach((e) => {
      const g = pages.current.findIndex((p) => p?.firstElementChild?.nextElementSibling === e.target)
      if (g >= 0 && g !== scene) { measure(g); wake() }
    }))
    pages.current.forEach((p) => { const c = p?.firstElementChild?.nextElementSibling; if (c) ro.observe(c) })

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60)
      last = now
      let moving = false
      for (const t of [rho, swell, tabT, ...lift]) {
        const p = Math.min(1, (now - t.t0) / t.dur)
        t.x = t.from + (t.to - t.from) * t.ease(p)
        if (p < 1) moving = true
      }
      if (shutting && !hold && rho.x <= 1e-4) {
        // shut: the scene changes behind the blades, a beat, then they reopen
        hold = now + (reduced ? 0 : 130)
        const gone = scene
        scene = next
        if (gone >= 0) measure(gone)
        if (scene >= 0) { swell.x = 1; set(swell, 0, 1000, outQuart) }
      }
      if (hold && now >= hold) {
        hold = 0; shutting = false
        if (scene >= 0) { set(rho, out, 1000, outQuart); set(tabT, 1, 900, outCubic) }
        else set(rho, 1, 850, outCubic)
      }
      // speed bends the edges; they ease back to straight once the blades stop
      const { V, A } = home(rho.x)
      const mr = V.reduce((t, p) => t + Math.hypot(p[0] - cx, p[1] - cy), 0) / N / r0 // how open, whichever way
      const vel = (mr - prev) / dt
      prev = mr
      bend += (Math.max(-1, Math.min(1, vel * 0.16)) - bend) * Math.min(1, dt * 7)
      if (reduced) bend = 0
      wave += dt * 10 // the ripple runs outward along each edge

      places.forEach((_, g) => {
        const el = sheets.current[g], pg = pages.current[g], bl = blades.current[g], k = slot[g], lb = labels.current[g], hd = headings.current[g]
        if (!el || !pg) return
        if (lb) lb.style.visibility = g === scene ? 'hidden' : ''
        // the frosted pane over a preview clears while the pointer is on it
        const gl = glass.current[g]
        if (gl) { gl.style.visibility = g === scene ? 'hidden' : ''; gl.style.opacity = String(1 - lift[g].x) }
        if (hd) hd.style.visibility = g === scene ? '' : 'hidden'
        pg.style.setProperty('--o', g === scene ? '1' : '0') // a preview shows only what its page marks data-peek
        const P = curved(V, A, k)
        let d = path(P)
        if (scene >= 0 && g !== scene && tabT.x > 0) {
          // its corner triangle grows in from the corner as the blade leaves (and shrinks back as it
          // returns); drawn turning the same way as the blade, so the two join rather than cancel
          const T = dock[slot[scene]].tri[k], q = tabT.x, o = T[0]
          let t = T.map((p) => [o[0] + (p[0] - o[0]) * q, o[1] + (p[1] - o[1]) * q] as Pt)
          const area = (Q: Pt[]) => Q.reduce((a, p, i) => { const r = Q[(i + 1) % Q.length]; return a + p[0] * r[1] - r[0] * p[1] }, 0)
          if (Math.sign(area(t)) !== Math.sign(area(P))) t = t.reverse()
          d += path(t)
        }
        if (bl) {
          bl.setAttribute('d', d)
          // the scene's own blade is painted plain, so the page behind doesn't show through it,
          // and fades with its edge once the page is open
          bl.setAttribute('fill', g === scene ? `var(--tone-${g + 1})` : 'transparent')
          bl.style.fillOpacity = g === scene ? String(1 - tabT.x) : ''
          // edges faint at rest, brighter on the blade under the pointer; the open page's fades away
          bl.style.strokeOpacity = String((0.1 + 0.45 * lift[g].x) * (g === scene ? 1 - tabT.x : 1))
        }
        if (g === scene) {
          pg.style.filter = ''
          const s = 1 + 0.05 * swell.x
          el.style.clipPath = 'none'
          el.style.zIndex = '10'
          pg.style.transform = swell.x < 1e-4 ? 'none' : `translate(${((1 - s) * W) / 2}px, ${((1 - s) * H) / 2}px) scale(${s})`
          return
        }
        const R = rest[g]
        el.style.clipPath = `path('${d}')`
        el.style.zIndex = '20'
        if (!R) return
        // hover swells the page a little, from the top middle of what it shows, away from the label
        const z = 1 + 0.06 * lift[g].x, cxp = R.x + R.s * R.ox, cyp = R.y + R.s * R.oy
        pg.style.transform = `translate(${cxp - (cxp - R.x) * z}px, ${cyp - (cyp - R.y) * z}px) scale(${R.s * z})`
        const q = 1 - lift[g].x, fr = 2 * q
        pg.style.filter = q > 0.02 ? `blur(${fr / (R.s * z)}px) grayscale(${q}) sepia(${0.45 * q}) brightness(${1 - 0.12 * q})` : ''
        if (lb) {
          // the label moves from its resting place into its corner tab, shrinking to fit
          const q = scene >= 0 ? tabT.x : 0, T = scene >= 0 ? dock[slot[scene]].L[k] : { c: [0, 0], s: 1 }, sc = 1 + (T.s - 1) * q
          lb.style.transform = `translate(${R.lx + (T.c[0] - (R.lw * T.s) / 2 - R.lx) * q}px, ${R.ly + (T.c[1] - (R.lh * T.s) / 2 - R.ly) * q}px) scale(${sc})`
        }
      })
      if (hero.current) hero.current.style.visibility = scene < 0 ? 'visible' : 'hidden'

      raf = moving || shutting || hold > 0 || Math.abs(bend) > 1e-3 ? requestAnimationFrame(frame) : 0
    }
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    engine.current = {
      aim(g) {
        if (g === (shutting ? next : scene)) return
        next = g; shutting = true; hold = 0
        set(rho, 0, rho.x > 1.2 ? 520 : 440, inCubic) // accelerate into the stop
        set(tabT, 0, 440, inCubic)
        lift.forEach((t) => set(t, 0, 300, outCubic))
        const leaving = scene >= 0 ? pages.current[scene] : null
        setTimeout(() => leaving?.scrollTo(0, 0), 450)
        wake()
      },
      hover(g) {
        if (shutting) return
        if (g === scene) g = -1
        lift.forEach((t, k) => { if (t.to !== (k === g ? 1 : 0)) set(t, k === g ? 1 : 0, 320, outCubic) })
        wake()
      },
    }
    // Arriving straight at /#section, or resizing with one open: no ceremony, the page is just there.
    if (openRef.current >= 0) {
      scene = openRef.current; rho.x = rho.from = rho.to = prev = out
      tabT.x = tabT.from = tabT.to = 1
    }
    frame(performance.now())
    const t = first && scene < 0 && !reduced ? setTimeout(() => { if (!shutting && scene < 0) { set(rho, 1, 1100, outQuart); wake() } }, 300) : 0
    if (!first && scene < 0) set(rho, 1, 400, outCubic)
    wake()
    return () => { cancelAnimationFrame(raf); clearTimeout(t); ro.disconnect() }
  }, [W, H]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engine.current?.aim(open)
    setAtTop(true)
    // Only the open page takes focus and keyboard; the blades are pictures.
    sheets.current.forEach((el, g) => { if (el) el.inert = g !== open })
    if (open >= 0) headings.current[open]?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && openRef.current >= 0) go(-1) }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const busy = open >= 0

  return (
    <div className="relative overflow-hidden !rounded-none bg-[var(--tone-0)]" style={{ height: H || '100dvh' }}>
      {W > 0 && (
        <div
          ref={hero}
          aria-hidden={busy}
          className={`absolute overflow-hidden !rounded-full ring-1 ring-amber-200/15 ${busy ? '[&_a]:pointer-events-none' : ''}`}
          style={{ left: cx - D / 2, top: cy - D / 2, width: D, height: D, '--d': `${D}px` } as React.CSSProperties}
        >
          {intro}
        </div>
      )}

      {W > 0 && places.map((p, g) => (
        <section
          key={p.id}
          ref={(el) => { sheets.current[g] = el }}
          aria-labelledby={`h-${p.id}`}
          className="absolute inset-0 !rounded-none"
          style={{ background: `var(--tone-${g + 1})`, clipPath: 'polygon(0 0, 0 0, 0 0)' }}
        >
          {/* Frosted glass over the whole pane: the preview beneath is blurred (by the engine) and
              veiled in the pane's own tone. The label sits above it, sharp. */}
          <div ref={(el) => { glass.current[g] = el }} aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] !rounded-none"
            style={{ background: `color-mix(in srgb, var(--tone-${g + 1}) 32%, transparent)` }} />
          <div ref={(el) => { labels.current[g] = el }} aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-[2] origin-top-left whitespace-nowrap !rounded-none text-[1.75rem] leading-tight font-normal tracking-tight text-amber-200 ">
            {p.title}
          </div>
          <div
            ref={(el) => { pages.current[g] = el }}
            onScroll={open === g ? (e) => setAtTop(e.currentTarget.scrollTop < 24) : undefined}
            className={`peek absolute left-0 top-0 h-full w-full origin-top-left !rounded-none will-change-transform ${open === g ? 'overflow-y-auto overscroll-contain' : 'overflow-visible'}`}
          >
            <div className="mx-auto max-w-4xl px-5 pb-16 pt-16 sm:px-12 sm:pt-20">
              <h2 id={`h-${p.id}`} ref={(el) => { headings.current[g] = el }} tabIndex={-1} className="pb-10 text-center text-4xl sm:text-6xl font-semibold tracking-tight text-amber-200 focus:outline-none">{p.title}</h2>
              <div className={p.bare && open !== g ? 'invisible' : ''}>{p.content}</div>
            </div>
          </div>
        </section>
      ))}

      {/* A soft vignette: the screen's edges sink a little, so the eye settles on the portrait. */}
      {W > 0 && (
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-30 !rounded-none transition-opacity duration-700 ${busy ? 'opacity-0' : ''}`}
          style={{ background: `radial-gradient(ellipse ${W * 0.75}px ${H * 0.8}px at ${cx}px ${cy}px, transparent 45%, rgb(28 24 18 / 0.5) 100%)` }} />
      )}

      {/* Home, at the top centre clear of the corner blades; it steps aside once the page scrolls. */}
      {busy && (
        <button type="button" onClick={() => go(-1)} aria-label="Back to home" tabIndex={atTop ? 0 : -1}
          className={`absolute left-1/2 top-4 z-50 grid h-11 w-11 -translate-x-1/2 place-items-center !rounded-full border border-amber-200/30 text-amber-200 transition-[opacity,background-color] duration-300 hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:top-6 ${atTop ? '' : 'pointer-events-none opacity-0'}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 11l8-7 8 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" /></svg>
        </button>
      )}

      {/* The blades' edges, and what the pointer and keyboard actually press. */}
      {W > 0 && (
        <svg className="pointer-events-none absolute inset-0 z-40" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {places.map((p, g) => (
            <path
              key={p.id}
              ref={(el) => { blades.current[g] = el }}
              role="button"
              tabIndex={open === g ? -1 : 0}
              aria-label={`Open ${p.title}: ${p.caption}`}
              onClick={() => go(g)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(g) } }}
              onPointerEnter={() => engine.current?.hover(g)}
              onPointerLeave={() => engine.current?.hover(-1)}
              onFocus={() => engine.current?.hover(g)}
              onBlur={() => engine.current?.hover(-1)}
              className={`cursor-pointer stroke-amber-200 outline-none focus-visible:![stroke-opacity:1] [stroke-width:1] [vector-effect:non-scaling-stroke] focus-visible:stroke-amber-200 focus-visible:[stroke-width:2] ${open === g ? 'pointer-events-none' : '[pointer-events:all]'}`}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
