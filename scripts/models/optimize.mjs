/**
 * STEP -> GLB, stage two.
 *
 * Takes the tessellated meshes from convert.py and makes them web-weight:
 * every part collapses onto one shared material (the viewer re-shades
 * everything anyway), which lets join() merge an assembly of hundreds of
 * bodies into a single draw call. The two large assemblies then get decimated
 * to a triangle budget, and everything is quantized and meshopt-compressed.
 *
 *   npm i -D @gltf-transform/core @gltf-transform/extensions \
 *            @gltf-transform/functions meshoptimizer
 *   node scripts/models/optimize.mjs
 *
 * Meshopt rather than Draco on purpose: drei decodes it with a bundled
 * decoder, so no decoder is fetched from a CDN at runtime.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { dedup, flatten, join, prune, quantize, simplify, unpartition, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RAW = path.join(HERE, '.raw')
const DST = path.join(HERE, '..', '..', 'public', 'models')

/** slug -> triangle budget, or null to keep full resolution. */
const BUDGET = {
  'signet-ring': null,
  'band-ring': null,
  clock: null,
  'combat-robot-1': null,
  'combat-robot-2': null,
  'ultrasound-ee': null,
  exoskeleton: 200_000,
  humanoid: 260_000,
}

fs.mkdirSync(DST, { recursive: true })

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

await MeshoptEncoder.ready
await MeshoptSimplifier.ready

let total = 0

for (const [slug, budget] of Object.entries(BUDGET)) {
  const doc = await io.read(path.join(RAW, `${slug}.glb`))
  const root = doc.getRoot()

  const triCount = () =>
    root.listMeshes().reduce(
      (n, mesh) =>
        n +
        mesh.listPrimitives().reduce((k, prim) => {
          const count = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()
          return k + count / 3
        }, 0),
      0,
    )

  const before = triCount()

  // One material for the whole assembly, so join() can actually merge.
  const surface = doc.createMaterial('surface').setRoughnessFactor(1).setMetallicFactor(0)
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) prim.setMaterial(surface)
  }

  await doc.transform(
    unpartition(),
    dedup(),
    prune({ keepAttributes: false, keepLeaves: false }),
    flatten(),
    join({ keepNamed: false }),
    weld(),
  )

  const joined = triCount()
  if (budget && joined > budget) {
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: budget / joined, error: 0.0008, lockBorder: false }),
    )
  }

  await doc.transform(
    prune(),
    dedup(),
    quantize({ pattern: /^(POSITION|NORMAL)$/, quantizePosition: 14, quantizeNormal: 10 }),
  )

  doc
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

  const out = path.join(DST, `${slug}.glb`)
  await io.write(out, doc)

  const mb = +(fs.statSync(out).size / 1e6).toFixed(2)
  total += mb
  console.log(JSON.stringify({ slug, trisBefore: Math.round(before), trisAfter: Math.round(triCount()), mb }))
}

console.log(`total ${total.toFixed(2)} MB`)
