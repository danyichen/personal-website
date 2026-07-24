# Model pipeline

Turns the STEP assemblies in `public/design` into the compressed GLB files the
design viewer loads from `public/models`.

```bash
# stage one — tessellate BREP solids into meshes (Python 3.13 or older; cascadio
# has no 3.14 wheels yet)
python3.13 -m venv .venv && .venv/bin/pip install cascadio trimesh
.venv/bin/python scripts/models/convert.py

# stage two — merge, decimate, quantize, compress
npm i -D @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
node scripts/models/optimize.mjs
```

## Adding a model

1. Drop the STEP file in `public/design`.
2. Add a `(filename, slug, tolerance)` row to `JOBS` in `convert.py`. Start at
   0.05 mm for something palm-sized, 0.15 mm for a benchtop assembly, 0.45 mm
   for anything person-sized, then check the triangle count it reports.
3. Add the slug to `BUDGET` in `optimize.mjs` — `null` unless it lands above
   ~250k triangles, in which case give it a budget.
4. Add an entry to `src/app/personal/design/data.ts`. The `parts` field is the
   part count `convert.py` prints.

## Notes

- The viewer re-shades every model with one material, so colours in the STEP
  files are deliberately discarded. Change the look in one place: `SURFACE` in
  `ModelStage.tsx`.
- Compression is meshopt, not Draco, because drei bundles the meshopt decoder
  and would otherwise pull a Draco decoder off a Google CDN at runtime.
- `.raw` holds the intermediate uncompressed meshes and is disposable.
