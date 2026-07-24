'use client'

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import type { Turn } from './data'
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei'

/**
 * Every model is re-shaded in this one material, so a jewellery band and a
 * humanoid read as parts of the same collection. Warm brass against the
 * site's brown, rather than whatever colours the STEP files shipped with.
 */
const SURFACE = new THREE.MeshStandardMaterial({
  color: '#e0cfa9',
  metalness: 0.62,
  roughness: 0.31,
  envMapIntensity: 1.15,
})

/** Longest edge of every model after fitting, in world units. */
const FIT = 2

/** What the camera needs to know to frame a model tightly. */
type Metrics = { halfHeight: number; sweptRadius: number }

const AXIS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

/**
 * Composes quarter turns about the world axes, in the order given. Each turn
 * is premultiplied so it acts on the world frame rather than on whatever the
 * previous turn left pointing where.
 */
function orientation(turns: Turn[] = []) {
  const quaternion = new THREE.Quaternion()
  const step = new THREE.Quaternion()
  for (const turn of turns) {
    const axis = AXIS[turn[0] as 'x' | 'y' | 'z']
    const angle = (turn[1] === '+' ? 1 : -1) * (Math.PI / 2)
    quaternion.premultiply(step.setFromAxisAngle(axis, angle))
  }
  return quaternion
}

function Model({
  url,
  turns,
  onFit,
}: {
  url: string
  turns?: Turn[]
  onFit: (metrics: Metrics) => void
}) {
  const { scene } = useGLTF(url, false, true)
  const turnKey = (turns ?? []).join(',')

  const { object, bottom, radius, metrics } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) mesh.material = SURFACE
    })

    // Stand the model up first — everything below measures it as it will be seen.
    object.quaternion.copy(orientation(turns))
    object.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = FIT / Math.max(size.x, size.y, size.z)

    object.scale.setScalar(scale)
    object.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

    return {
      object,
      bottom: (-size.y * scale) / 2,
      radius: Math.max(size.x, size.z) * scale,
      metrics: {
        halfHeight: (size.y * scale) / 2,
        // Widest the silhouette can get while the model spins about Y.
        sweptRadius: 0.5 * Math.hypot(size.x * scale, size.z * scale),
      },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- turnKey stands in for turns
  }, [scene, turnKey])

  useLayoutEffect(() => onFit(metrics), [metrics, onFit])

  return (
    <>
      <primitive object={object} />
      <ContactShadows
        position={[0, bottom - 0.02, 0]}
        scale={Math.max(radius * 2.6, 3)}
        opacity={0.5}
        blur={2.6}
        far={Math.max(radius, 1.5)}
        resolution={512}
        color="#17120b"
      />
    </>
  )
}

function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null
  return (
    <Html center>
      <div className="flex w-32 flex-col items-center gap-2">
        <div className="h-px w-full overflow-hidden bg-white/15">
          <div
            className="h-full bg-amber-200 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-amber-100/50">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  )
}

/**
 * Lightformers build the environment map in-scene, so the studio lighting
 * needs no HDR fetched from a CDN.
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#2c271f']} />
      {/* key */}
      <Lightformer intensity={3.2} color="#fff4de" position={[0, 5, -9]} scale={[12, 12, 1]} />
      {/* warm side wrap */}
      <Lightformer
        intensity={1.4}
        color="#f4d79b"
        position={[-7, 2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[9, 9, 1]}
      />
      {/* cool sage bounce, picked up from the project chips */}
      <Lightformer
        intensity={1}
        color="#849483"
        position={[7, -1, 3]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[9, 9, 1]}
      />
      {/* floor bounce */}
      <Lightformer
        intensity={1.5}
        color="#ffffff"
        position={[0, -7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
    </Environment>
  )
}

/** Viewing direction, normalised. Slightly above and to the side of the model. */
const EYE = new THREE.Vector3(0.62, 0.34, 0.71).normalize()

/**
 * Pulls the camera back just far enough that the model fills the frame at any
 * spin angle — a tall humanoid and a flat ring both end up well composed.
 */
function Rig({
  metrics,
  controls,
  resetKey,
}: {
  metrics: Metrics | null
  controls: React.MutableRefObject<any>
  resetKey: number
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const aspect = useThree((state) => state.viewport.aspect)

  useLayoutEffect(() => {
    if (!metrics) return

    const vFov = (camera.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const distance =
      Math.max(
        metrics.halfHeight / Math.tan(vFov / 2),
        metrics.sweptRadius / Math.tan(hFov / 2),
      ) * 1.22

    camera.position.copy(EYE).multiplyScalar(distance)
    camera.near = distance / 100
    camera.far = distance * 20
    camera.updateProjectionMatrix()

    const orbit = controls.current
    if (orbit) {
      // OrbitControls locks touch-action to none, which traps a scrolling
      // thumb on the canvas. pan-y hands vertical swipes back to the page and
      // keeps sideways drags for rotating.
      if (orbit.domElement) orbit.domElement.style.touchAction = 'pan-y'
      orbit.target.set(0, 0, 0)
      orbit.minDistance = distance * 0.4
      orbit.maxDistance = distance * 2.6
      orbit.update()
      // So the reset button returns here rather than to the initial camera.
      orbit.saveState()
    }
  }, [metrics, aspect, camera, controls, resetKey])

  return null
}

export default function ModelStage({
  url,
  turns,
  autoRotate,
  active,
  resetKey,
  onUserInteract,
}: {
  url: string
  turns?: Turn[]
  autoRotate: boolean
  active: boolean
  resetKey: number
  onUserInteract: () => void
}) {
  const controls = useRef<any>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  // A new model gets framed from scratch rather than inheriting the last one's.
  useEffect(() => setMetrics(null), [url])

  return (
    <Canvas
      frameloop={active ? 'always' : 'demand'}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 34, position: [2.6, 1.5, 3.4] }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#fff1d6" />
      <Studio />

      <Suspense fallback={<Loader />}>
        <Model url={url} turns={turns} onFit={setMetrics} />
      </Suspense>

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.85}
        zoomSpeed={0.7}
        autoRotate={autoRotate}
        autoRotateSpeed={0.325}
        onStart={onUserInteract}
      />
      <Rig metrics={metrics} controls={controls} resetKey={resetKey} />
    </Canvas>
  )
}
