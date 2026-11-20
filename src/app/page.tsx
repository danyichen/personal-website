import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FiCheck, FiMinus } from 'react-icons/fi'
import { projects } from './projects/data'
import { Stage } from './client'

const DesignShowcase = dynamic(() => import('./personal/design/DesignShowcase'))
const CustomAudioPlayer = dynamic(() => import('./personal/CustomAudioPlayer'))

/* ---------- data ---------- */

type LinkKind = 'access' | 'open' | 'pdf' | 'code'
type PubLink = { kind: LinkKind; href: string; label?: string }
type Entry = { year: string; text: React.ReactNode; links: PubLink[] }

const PDF_TMRB = '/Design_of_a_Compliant_Quasi_Direct_drive_End_Effector_for_Robotic_Ultrasound_Imaging.pdf'

const experience = [
  {
    place: 'Duke University',
    advisor: 'Dr. Brian Mann',
    items: [
      'Designing focused ultrasound therapy systems',
      'Identifying nonlinear dynamics',
      'Developing safe robotic ultrasound imaging',
      'Writing ROS 2 libraries for robot arm control',
      'Creating surgical training simulators',
    ],
  },
  {
    place: 'North Carolina State University',
    advisor: 'Dr. Hao Su',
    items: ['Designed exoskeletons and humanoid robot systems', 'Applied reinforcement learning for bipedal locomotion'],
  },
  {
    place: 'Wake Forest University',
    advisor: 'Dr. Saami Yazdani',
    items: [
      'Developed benchtop bioreactor to simulate peripheral artery blood-flow and motion',
      'Conducted drug-eluting stent pharmacokinetic experiments',
    ],
  },
]

const publications: Entry[] = [
  {
    year: '2026',
    text: <>D. Chen, R. Prakash, V. Y. Wang, Z. Chen, S. Dias, D. M. Buckland, L. J. Bridgeman, S. R. Oca, and B. P. Mann, “Design and Evaluation of a Compliant Quasi-Direct Drive End-Effector for Safe Robotic Ultrasound Imaging,” <i>IEEE Transactions on Medical Robotics and Bionics</i>, 2026.</>,
    links: [{ kind: 'access', href: 'http://dx.doi.org/10.1109/TMRB.2026.3699216' }, { kind: 'pdf', href: PDF_TMRB }],
  },
  {
    year: '2026',
    text: <>O. Oladokun, K. K. Yamamoto, D. Chen, L. Triplett, S. Barter, C. Reid, T. J. Zachem, B. P. Mann, K. L. Jackson, and S. Zani, “Insufflatable Modular Abdominal Simulation Environment (MASE) for Surgical Training Simulation,” <i>Surgical Innovation</i>, 2026, Art. no. 15533506261451391.</>,
    links: [{ kind: 'access', href: 'https://journals.sagepub.com/doi/abs/10.1177/15533506261451391' }],
  },
  {
    year: '2025',
    text: <>T. Ursillo, K. Lowry, C. Allred, M. Phillips, L. B. Liu, D. Chen, and S. K. Yazdani, “The Impact of Peripheral Vascular Motion on Acute Drug Retention of Intravascular Devices,” <i>Cardiovascular Engineering and Technology</i>, vol. 16, pp. 322–332, 2025.</>,
    links: [{ kind: 'open', href: 'https://link.springer.com/article/10.1007/s13239-025-00776-z' }],
  },
  {
    year: '2024',
    text: <>D. Chen, C. Krinsky, M. Phillips, C. Allred, A. Khan, L. B. Liu, U. Christians, and S. K. Yazdani, “Design and use of an ex vivo peripheral simulating bioreactor system for pharmacokinetic analysis of a drug coated stent,” <i>Bioengineering &amp; Translational Medicine</i>, vol. 9, no. 2, p. e10618, 2024.</>,
    links: [
      { kind: 'open', href: 'https://aiche.onlinelibrary.wiley.com/doi/full/10.1002/btm2.10618' },
      { kind: 'pdf', href: 'https://aiche.onlinelibrary.wiley.com/doi/pdf/10.1002/btm2.10618' },
    ],
  },
  {
    year: '2022',
    text: <>D. Chen, D. Martinez, and T. H. Taylor, “Design of a Low-Cost Autonomous Epipelagic Profiling System for Oceanic Research,” in <i>2022 Systems and Information Engineering Design Symposium (SIEDS)</i>, 2022, pp. 79–84.</>,
    links: [{ kind: 'access', href: 'https://ieeexplore.ieee.org/abstract/document/9799420' }],
  },
]

const presentations: Entry[] = [
  {
    year: '2025',
    text: <>D. Chari-Letts, K. K. Yamamoto, O. Oladokun, D. Chen, L. Triplett, L. Jackson, P. Codd, and S. Zani, “Development of Patient-specific and Dynamic ED Thoracotomy Model for Surgical Training,” presented at <i>2025 ACS Surgeons and Engineers</i>, 2025.</>,
    links: [],
  },
  {
    year: '2023',
    text: <>D. Chen, M. Dan, S. Zhang, I. Dominguez, V. Shetty, W. Gao, T. H. Taylor, S. Ranjan, and H. Su, “Design and Control of an Open-Source Agile Bipedal Humanoid Robot with High-Torque Density Motors for Household Assistance,” presented at <i>International Symposium on Medical Robotics (ISMR)</i>, Georgia, USA, 2023.</>,
    links: [{ kind: 'pdf', label: 'Poster', href: '/2023_ISMR_Design%20and%20Control%20of%20an%20Open-Source%20Agile%20Bipedal%20Humanoid%20Robot%20with%20High-Torque%20Density%20Motors%20for%20Household%20Assistance.pdf' }],
  },
]

/* ---------- small pieces ---------- */

const EXTERNAL = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />

const PILL: Record<LinkKind, { cls: string; label: string; icon: React.ReactNode }> = {
  access: { cls: 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 border-amber-500/20', label: 'Access', icon: EXTERNAL },
  open: { cls: 'bg-[#849483]/20 text-[#D0E0CF] hover:bg-[#849483]/30 border-[#849483]/40', label: 'Open Access', icon: EXTERNAL },
  pdf: { cls: 'bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 border-rose-500/20', label: 'PDF', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> },
  code: { cls: 'bg-amber-900/40 text-amber-200 hover:bg-amber-900/60 border-amber-900/20', label: 'Code', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" /> },
}

function Pill({ kind, href, label }: PubLink) {
  const p = PILL[kind]
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium !rounded-full border transition duration-200 hover:scale-105 active:scale-95 ${p.cls}`}
    >
      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">{p.icon}</svg>
      {label ?? p.label}
    </a>
  )
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base italic text-amber-200/60 mb-4">{children}</h3>
)

function Entries({ rows, peek = 0 }: { rows: Entry[]; peek?: number }) {
  return (
    <ol className="space-y-5">
      {rows.map((r, i) => (
        <li key={i} data-peek={i < peek || undefined} className="grid grid-cols-[3.5rem_1fr] gap-4">
          <span className="pt-0.5 text-sm tabular-nums text-amber-200/60">{r.year}</span>
          <div>
            <p className="text-amber-100/90 leading-relaxed [text-wrap:pretty]">{r.text}</p>
            {r.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">{r.links.map((l) => <Pill key={l.href} {...l} />)}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

const PROJECT_LINKS = (p: (typeof projects)[number]) => {
  const pub = p.publications?.[0]
  const links: PubLink[] = []
  if (p.githubUrl) links.push({ kind: 'code', href: p.githubUrl })
  const article = p.articleUrl || pub?.articleUrl
  if (article) links.push({ kind: 'access', href: article, label: 'Paper' })
  const pdf = p.pdfUrl || pub?.pdfUrl
  if (pdf) links.push({ kind: 'pdf', href: pdf, label: p.pdfLabel || pub?.pdfLabel || 'PDF' })
  return links
}

// Projects with papers first, newest paper first; then posters, then code, then the rest.
const year = (p: (typeof projects)[number]) =>
  Math.max(0, ...[p.publication, ...(p.publications ?? []).map((x) => x.text)].join(' ').match(/(19|20)\d\d/g)?.map(Number) ?? [])
const kind = (p: (typeof projects)[number]) =>
  p.articleUrl || p.publications?.some((x) => x.articleUrl) ? 0 : p.pdfLabel === 'Poster' ? 1 : p.githubUrl ? 2 : 3
const ordered = [...projects].sort((a, b) => kind(a) - kind(b) || year(b) - year(a))

const about = (
  <div className="space-y-12">
    <div>
      <div data-peek><Label>Education</Label></div>
      <div className="grid sm:grid-cols-2 gap-6 text-amber-100/90">
        <div>
          <p data-peek className="font-semibold text-lg text-amber-50">Duke University</p>
          <p data-peek className="flex items-center gap-3">PhD in Mechanical Engineering <FiMinus className="w-4 h-4 text-amber-200" title="Ongoing" /></p>
          <p data-peek className="flex items-center gap-3">MS in Mechanical Engineering <FiCheck className="w-4 h-4 text-[var(--sage)]" title="Completed" /></p>
        </div>
        <div>
          <p data-peek className="font-semibold text-lg text-amber-50">Wake Forest University</p>
          <p data-peek className="flex items-center gap-3">BS in Engineering <FiCheck className="w-4 h-4 text-[var(--sage)]" title="Completed" /></p>
        </div>
      </div>
    </div>
    <div>
      <div data-peek><Label>Research experience</Label></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 text-amber-100/90">
        {experience.map((e, i) => (
          <div key={e.place}>
            <p data-peek={i === 0 || undefined} className="font-semibold text-amber-50">{e.place}</p>
            <p data-peek={i === 0 || undefined} className="italic text-amber-100/60 mb-2">Advisor: {e.advisor}</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-amber-200/40">
              {e.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const work = (
  <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
    {ordered.map((p, i) => (
      <li key={p.id} data-peek className="group relative flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden !rounded-2xl bg-black/20">
          {p.cardImage && (
            <Image src={p.cardImage} alt="" fill sizes="(max-width: 640px) 100vw, 430px"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          )}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-amber-200 [text-wrap:balance]">
          <Link href={`/projects/${p.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:underline">{p.title}</Link>
        </h3>
        <p className="mt-1 text-amber-100/70 leading-relaxed">{p.description}</p>
        <div className="relative z-[1] mt-3 flex flex-wrap gap-2">{PROJECT_LINKS(p).map((l) => <Pill key={l.href} {...l} />)}</div>
      </li>
    ))}
  </ul>
)

const papers = (
  <div className="space-y-10">
    <div><div data-peek><Label>Journal &amp; conference papers</Label></div><Entries rows={publications} peek={4} /></div>
    <div><Label>Presentations</Label><Entries rows={presentations} /></div>
  </div>
)

// Music and design side by side, each a stage with its list beneath, so both show at a glance.
// Design takes the right, where its blade has the most room, so the model list shows in the preview.
const personal = (
  <div>
    <p data-peek className="mb-10 text-center text-lg text-amber-100/70">What you won&apos;t find on my resume</p>
    <div className="grid gap-10 lg:-mx-24 lg:grid-cols-2">
      <CustomAudioPlayer />
      <DesignShowcase />
    </div>
  </div>
)

// Same as the production contact page.
const contact = (
  <div className="card">
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-amber-200">Email</h3>
        <a href="mailto:will.chen@duke.edu" className="text-amber-300">
          will.chen@duke.edu
        </a>
      </div>

      <div>
        <h3 className="text-lg font-medium text-amber-200">Location</h3>
        <p className="text-amber-100/90">
          100 Science Dr.<br />
          Department of Mechanical Engineering, Duke University<br />
          Durham, NC 27708
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-amber-200">Links</h3>
        <div className="flex space-x-4 mt-2">
          <a href="https://www.linkedin.com/in/danyi-chen-878b1b174/" target="_blank" rel="noreferrer" className="text-amber-300">
            LinkedIn
          </a>
          <a href="https://github.com/danyichen" target="_blank" rel="noreferrer" className="text-amber-300">
            GitHub
          </a>
          <a href="https://scholar.google.com/citations?user=_y5PQDYAAAAJ&hl=en&oi=sra" target="_blank" rel="noreferrer" className="text-amber-300">
            Google Scholar
          </a>
        </div>
      </div>
    </div>
  </div>
)

/* The hero fills the iris opening: a round portrait, with the words set on a
   shaded band across its lower part. Sizes follow --d, the portrait's diameter. */
const intro = (
  <>
    <Image src="/will-chen.jpg" alt="Portrait of Will Chen" fill priority sizes="(orientation: landscape) 75vh, 95vw" className="object-cover object-[50%_38%]" />
    {/* frosted glass under the words, fading in where the shading begins */}
    <div aria-hidden="true" className="absolute inset-0 !rounded-none backdrop-blur-md [-webkit-mask-image:linear-gradient(to_bottom,transparent_42%,black_62%)] [mask-image:linear-gradient(to_bottom,transparent_42%,black_62%)]" />
    <div aria-hidden="true" className="absolute inset-0 !rounded-none bg-[linear-gradient(to_bottom,transparent_46%,rgb(38_33_25/0.62)_60%,rgb(38_33_25/0.94)_80%)]" />
    <div className="absolute inset-x-[14%] bottom-[14%] !rounded-none text-center">
      <h1 className="whitespace-nowrap font-bold leading-none tracking-tight text-[length:calc(var(--d)*0.085)]">
        <span className="text-amber-200">Hi, I&apos;m Will</span>
        <span className="sr-only">陈丹颐</span>
      </h1>
      <p className="mt-[calc(var(--d)*0.02)] text-amber-100/70 text-[length:max(12px,calc(var(--d)*0.032))]">Danyi Chen | 陈丹颐</p>
      <h2 className="mx-auto mt-[calc(var(--d)*0.026)] leading-snug text-amber-100/80 [text-wrap:balance] text-[length:max(13px,calc(var(--d)*0.034))]">
        PhD Candidate in Mechanical Engineering @ Duke University
      </h2>
      <p className="mt-[calc(var(--d)*0.018)] whitespace-nowrap text-amber-100/70 text-[length:max(11px,calc(var(--d)*0.027))]">Robotics • Medical Devices • Machine Learning</p>
    </div>
  </>
)

export default function Home() {
  return (
    <Stage
      intro={intro}
      places={[
        { id: 'about', title: 'About', content: about, caption: 'Education and research', zoom: 0.52, pin: 'left' },
        { id: 'projects', title: 'Projects', content: work, caption: `${projects.length} robots and devices`, pin: 'up' },
        { id: 'publications', title: 'Publications', content: papers, caption: `${publications.length} papers, ${presentations.length} talks` },
        { id: 'contact', title: 'Contact', content: contact, caption: 'Email, location and links', bare: true },
        { id: 'personal', title: 'Personal', content: personal, caption: 'Drawings, models and music', zoom: 0.38, pin: 'right' },
      ]}
    />
  )
}
