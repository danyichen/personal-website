export type DesignModel = {
  slug: string
  title: string
  category: string
  description: string
  /** Solid bodies in the source CAD assembly. */
  parts: number
  /**
   * Quarter turns about the world axes, applied in order, before the model is
   * framed. STEP files land in whatever orientation they were drawn in; these
   * stand each one up so the camera meets it face on. Each entry is an axis
   * plus a direction, e.g. 'x-' is ninety degrees anticlockwise about world X.
   */
  turns?: Turn[]
}

export type Turn = 'x+' | 'x-' | 'y+' | 'y-' | 'z+' | 'z-'

/**
 * Source STEP assemblies live in /public/design and are converted to compressed
 * GLB at /public/models. Colours are deliberately not carried over — every model
 * is re-shaded in the viewer so the collection reads as one material study.
 */
export const designModels: DesignModel[] = [
  {
    slug: 'humanoid',
    title: 'Humanoid',
    category: 'Legged Robotics',
    description:
      'A full-body bipedal platform. 18 degrees of freedom',
    parts: 724,
  },
  {
    slug: 'exoskeleton',
    title: 'Hip Exoskeleton',
    category: 'Wearable Robotics',
    description:
      'A hip-mounted assistive exoskeleton.',
    parts: 258,
    turns: ['x-'],
  },
  {
    slug: 'ultrasound-ee',
    title: 'Ultrasound End Effector',
    category: 'Medical Robotics',
    description:
      'A quasi-direct drive end-effector for robotic ultrasound platforms.',
    parts: 27,
    turns: ['y-'],
  },
  {
    slug: 'combat-robot-1',
    title: 'Olethros-1',
    category: 'Combat Robotics',
    description:
      'Olethros (Biblical Greek: ὄλεθρος) — devastation, ruin, and destruction brought by God\'s judgment as the consequence of sin.',
    parts: 18,
    turns: ['x-'],
  },
  {
    slug: 'combat-robot-2',
    title: 'Mayfly',
    category: 'Combat Robotics',
    description:
      'The mayfly (Ephemeroptera, from the Greek ephēmeros, “lasting a day”) — a winged insect whose lifespan can be measured in minutes, yet it pours out the fullness of its life, before returning to the dust, for such is the end appointed to all beings of flesh.',
    parts: 18,
    turns: ['z-', 'x-'],
  },
  {
    slug: 'clock',
    title: 'Desk Clock',
    category: 'Product Design',
    description:
      'A modern minimalist clock inspired by the silent majesty of black holes.',
    parts: 11,
    turns: ['x-', 'y-'],
  },
  {
    slug: 'band-ring',
    title: 'Wedding Band',
    category: 'Jewellery',
    description:
      'My wife\'s wedding band, that I brought to life from her concept, casted in silver with diamond sets',
    parts: 1,
    turns: ['x-', 'y-'],
  },
  {
    slug: 'signet-ring',
    title: 'Wedding Ring',
    category: 'Jewellery',
    description:
      'My wedding ring, an interlaced knot worked into the face of the band, the strands passing over and under each other. Casted in silver',
    parts: 1,
    turns: ['x-', 'y-'],
  },
]
