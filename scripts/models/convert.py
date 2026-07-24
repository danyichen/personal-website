"""
STEP -> GLB, stage one.

Tessellates the BREP solids in public/design into triangle meshes. Tolerances
are in source units (mm) and set per model, since a 20 mm ring and a 1.1 m
humanoid do not want the same chord deflection.

    pip install cascadio trimesh
    python scripts/models/convert.py

Output lands in scripts/models/.raw, which stage two (optimize.mjs) reads.
"""

import json
import os
import time

import cascadio
import trimesh

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "public", "design")
OUT = os.path.join(ROOT, "scripts", "models", ".raw")

# (STEP filename, output slug, linear tolerance in mm)
JOBS = [
    ("ring.step", "signet-ring", 0.04),
    ("ring 2.step", "band-ring", 0.04),
    ("clock.step", "clock", 0.06),
    ("combat robot 1.step", "combat-robot-1", 0.15),
    ("combat robot 2.step", "combat-robot-2", 0.15),
    ("robot ultrasound end effector.step", "ultrasound-ee", 0.15),
    ("Humanoid.step", "humanoid", 0.45),
    ("hip mount exoskeleton.step", "exoskeleton", 0.45),
]

os.makedirs(OUT, exist_ok=True)

for filename, slug, tol in JOBS:
    src = os.path.join(SRC, filename)
    dst = os.path.join(OUT, slug + ".glb")

    start = time.time()
    cascadio.step_to_glb(
        src,
        dst,
        tol_linear=tol,
        tol_angular=0.35,
        tol_relative=False,
        merge_primitives=True,
    )
    elapsed = time.time() - start

    scene = trimesh.load(dst)
    geometries = scene.geometry.values() if hasattr(scene, "geometry") else []
    print(
        json.dumps(
            {
                "slug": slug,
                "mb": round(os.path.getsize(dst) / 1e6, 2),
                "tris": sum(len(g.faces) for g in geometries),
                "parts": len(geometries),
                "sec": round(elapsed, 1),
            }
        ),
        flush=True,
    )
