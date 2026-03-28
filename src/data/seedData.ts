import { newCard, type Deck } from '../types/practice'
import type { GroupSession } from '../context/GroupStudyContext'

/* ═══════════════════════════════════════════════
   SAMPLE PRACTICE DECKS (pre-loaded for testing)
   ═══════════════════════════════════════════════ */

const now = Date.now()
const day = 86_400_000

export const SEED_DECKS: Deck[] = [
  {
    id: 'deck-bece-math-001',
    title: 'BECE Maths — Number & Algebra',
    subject: 'Mathematics',
    level: 'BECE',
    description: 'Key concepts for JHS students',
    createdAt: now - 7 * day,
    lastStudiedAt: now - 1 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'What is 15% of GH₵ 200?', back: 'GH₵ 30' }),
      newCard({ type: 'mcq', front: 'Simplify: 3x + 2x − x', back: 'B', options: ['A. 3x', 'B. 4x', 'C. 5x', 'D. 6x'] }),
      newCard({ type: 'fill_blank', front: 'The LCM of 12 and 18 is _____.', back: '36' }),
      newCard({ type: 'flashcard', front: 'What is the formula for the area of a circle?', back: 'A = πr²' }),
      newCard({ type: 'mcq', front: 'If 2x + 5 = 13, what is x?', back: 'C', options: ['A. 3', 'B. 5', 'C. 4', 'D. 6'] }),
      newCard({ type: 'fill_blank', front: 'The HCF of 24 and 36 is _____.', back: '12' }),
      newCard({ type: 'flashcard', front: 'Convert 0.75 to a fraction in simplest form.', back: '3/4' }),
      newCard({ type: 'mcq', front: 'What is the value of 5²?', back: 'A', options: ['A. 25', 'B. 10', 'C. 32', 'D. 52'] }),
      newCard({ type: 'fill_blank', front: 'An angle greater than 90° but less than 180° is called _____.', back: 'obtuse' }),
      newCard({ type: 'flashcard', front: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?', back: '26 cm' }),
    ],
  },
  {
    id: 'deck-bece-science-001',
    title: 'BECE Integrated Science — Living Things',
    subject: 'Integrated Science',
    level: 'BECE',
    description: 'Biology fundamentals for BECE',
    createdAt: now - 5 * day,
    lastStudiedAt: now - 2 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'What is photosynthesis?', back: 'The process by which green plants make food using sunlight, water, and carbon dioxide' }),
      newCard({ type: 'mcq', front: 'Which part of the plant absorbs water from the soil?', back: 'B', options: ['A. Stem', 'B. Root', 'C. Leaf', 'D. Flower'] }),
      newCard({ type: 'fill_blank', front: 'The basic unit of life is the _____.', back: 'cell' }),
      newCard({ type: 'flashcard', front: 'Name 3 characteristics of living things.', back: 'Movement, respiration, nutrition, irritability (sensitivity), growth, reproduction, excretion — MR NIGER' }),
      newCard({ type: 'mcq', front: 'Which gas do plants release during photosynthesis?', back: 'A', options: ['A. Oxygen', 'B. Carbon dioxide', 'C. Nitrogen', 'D. Hydrogen'] }),
      newCard({ type: 'fill_blank', front: 'The green pigment in leaves that absorbs sunlight is called _____.', back: 'chlorophyll' }),
      newCard({ type: 'flashcard', front: 'What is the function of the mitochondria?', back: 'It is the powerhouse of the cell — produces energy (ATP) through cellular respiration' }),
      newCard({ type: 'mcq', front: 'Which of these is NOT a nutrient class?', back: 'D', options: ['A. Proteins', 'B. Carbohydrates', 'C. Vitamins', 'D. Plastics'] }),
    ],
  },
  {
    id: 'deck-wassce-physics-001',
    title: 'WASSCE Physics — Mechanics',
    subject: 'Physics',
    level: 'WASSCE',
    description: 'Newton\'s laws, motion, forces',
    createdAt: now - 3 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'State Newton\'s First Law of Motion.', back: 'An object remains at rest or in uniform motion in a straight line unless acted upon by an external force (Law of Inertia)' }),
      newCard({ type: 'mcq', front: 'A car accelerates from rest to 20 m/s in 5 seconds. What is the acceleration?', back: 'B', options: ['A. 2 m/s²', 'B. 4 m/s²', 'C. 5 m/s²', 'D. 100 m/s²'] }),
      newCard({ type: 'fill_blank', front: 'Force = mass × _____', back: 'acceleration' }),
      newCard({ type: 'flashcard', front: 'What is the SI unit of force?', back: 'Newton (N)' }),
      newCard({ type: 'mcq', front: 'A 10 kg object is acted upon by a net force of 50 N. What is its acceleration?', back: 'C', options: ['A. 0.2 m/s²', 'B. 500 m/s²', 'C. 5 m/s²', 'D. 50 m/s²'] }),
      newCard({ type: 'fill_blank', front: 'Work done = Force × _____ in the direction of the force', back: 'distance' }),
      newCard({ type: 'flashcard', front: 'Define momentum.', back: 'Momentum = mass × velocity. It is a vector quantity measured in kg·m/s' }),
      newCard({ type: 'mcq', front: 'Which is an example of a scalar quantity?', back: 'A', options: ['A. Speed', 'B. Velocity', 'C. Acceleration', 'D. Force'] }),
      newCard({ type: 'fill_blank', front: 'The acceleration due to gravity on Earth is approximately _____ m/s².', back: '10' }),
      newCard({ type: 'flashcard', front: 'State the principle of conservation of momentum.', back: 'In a closed system, the total momentum before a collision equals the total momentum after the collision' }),
    ],
  },
  {
    id: 'deck-wassce-chem-001',
    title: 'WASSCE Chemistry — Atomic Structure',
    subject: 'Chemistry',
    level: 'WASSCE',
    description: 'Atoms, electron config, periodic table',
    createdAt: now - 2 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'What are the three subatomic particles?', back: 'Proton (positive, in nucleus), Neutron (neutral, in nucleus), Electron (negative, orbits nucleus)' }),
      newCard({ type: 'mcq', front: 'What is the atomic number of Carbon?', back: 'B', options: ['A. 8', 'B. 6', 'C. 12', 'D. 14'] }),
      newCard({ type: 'fill_blank', front: 'Atoms of the same element with different numbers of neutrons are called _____.', back: 'isotopes' }),
      newCard({ type: 'flashcard', front: 'Write the electron configuration of Sodium (Na, Z=11).', back: '2, 8, 1 — Sodium has 11 electrons arranged in 3 shells' }),
      newCard({ type: 'mcq', front: 'Which type of bonding occurs between Na and Cl?', back: 'A', options: ['A. Ionic', 'B. Covalent', 'C. Metallic', 'D. Van der Waals'] }),
      newCard({ type: 'fill_blank', front: 'The maximum number of electrons in the second shell is _____.', back: '8' }),
      newCard({ type: 'flashcard', front: 'What is an ion?', back: 'An atom or group of atoms that has gained or lost electrons, giving it a net positive or negative charge' }),
      newCard({ type: 'mcq', front: 'In the periodic table, elements in the same group have the same number of:', back: 'C', options: ['A. Protons', 'B. Neutrons', 'C. Valence electrons', 'D. Electron shells'] }),
    ],
  },
  {
    id: 'deck-bece-english-001',
    title: 'BECE English — Grammar & Vocabulary',
    subject: 'English Language',
    level: 'BECE',
    description: 'Essential grammar rules and vocabulary',
    createdAt: now - 6 * day,
    lastStudiedAt: now - 3 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'What is a noun?', back: 'A word that names a person, place, thing, or idea. E.g. Accra, Kofi, happiness, table' }),
      newCard({ type: 'mcq', front: 'Choose the correct sentence:', back: 'B', options: ['A. He don\'t like rice.', 'B. He doesn\'t like rice.', 'C. He not like rice.', 'D. He no like rice.'] }),
      newCard({ type: 'fill_blank', front: 'The plural of "child" is _____.', back: 'children' }),
      newCard({ type: 'flashcard', front: 'What is the difference between "their", "there", and "they\'re"?', back: '"their" = possessive (their books), "there" = place (over there), "they\'re" = they are (they\'re coming)' }),
      newCard({ type: 'mcq', front: 'Which word is an adverb?', back: 'C', options: ['A. Beautiful', 'B. Beauty', 'C. Beautifully', 'D. Beautify'] }),
      newCard({ type: 'fill_blank', front: 'A word that describes a noun is called an _____.', back: 'adjective' }),
      newCard({ type: 'flashcard', front: 'What is a simile?', back: 'A figure of speech comparing two things using "like" or "as". E.g. "She runs like the wind"' }),
      newCard({ type: 'mcq', front: 'Which sentence is in the passive voice?', back: 'B', options: ['A. Ama cooked the rice.', 'B. The rice was cooked by Ama.', 'C. Ama is cooking rice.', 'D. Cook the rice, Ama.'] }),
    ],
  },
  {
    id: 'deck-bece-social-001',
    title: 'BECE Social Studies — Ghana & Government',
    subject: 'Social Studies',
    level: 'BECE',
    description: 'Governance, history, environment',
    createdAt: now - 4 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'When did Ghana gain independence?', back: '6th March 1957 — Ghana was the first sub-Saharan African country to gain independence from colonial rule (Britain)' }),
      newCard({ type: 'mcq', front: 'Who was the first President of Ghana?', back: 'A', options: ['A. Dr. Kwame Nkrumah', 'B. J.B. Danquah', 'C. Kofi Busia', 'D. Jerry Rawlings'] }),
      newCard({ type: 'fill_blank', front: 'The capital city of Ghana is _____.', back: 'Accra' }),
      newCard({ type: 'flashcard', front: 'Name the three arms of government in Ghana.', back: 'Executive (President), Legislature (Parliament), Judiciary (Courts)' }),
      newCard({ type: 'mcq', front: 'Which river is the largest in Ghana?', back: 'C', options: ['A. River Pra', 'B. River Ankobra', 'C. River Volta', 'D. River Tano'] }),
      newCard({ type: 'fill_blank', front: 'Ghana has _____ regions as of 2019.', back: '16' }),
      newCard({ type: 'flashcard', front: 'What is the role of the Judiciary?', back: 'To interpret the laws of the country, settle disputes, and ensure justice. The highest court is the Supreme Court.' }),
      newCard({ type: 'mcq', front: 'Which of these is a renewable energy source?', back: 'D', options: ['A. Coal', 'B. Natural gas', 'C. Crude oil', 'D. Solar energy'] }),
    ],
  },
  {
    id: 'deck-wassce-bio-001',
    title: 'WASSCE Biology — Cell Biology & Genetics',
    subject: 'Biology',
    level: 'WASSCE',
    description: 'Cells, DNA, heredity',
    createdAt: now - 1 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'What is DNA?', back: 'Deoxyribonucleic acid — a double helix molecule that carries genetic information in all living organisms' }),
      newCard({ type: 'mcq', front: 'Which organelle is responsible for protein synthesis?', back: 'B', options: ['A. Mitochondria', 'B. Ribosome', 'C. Golgi body', 'D. Lysosome'] }),
      newCard({ type: 'fill_blank', front: 'The process of cell division that produces two identical daughter cells is called _____.', back: 'mitosis' }),
      newCard({ type: 'flashcard', front: 'What is the difference between dominant and recessive alleles?', back: 'Dominant alleles (AA, Aa) express their trait even with one copy. Recessive alleles (aa) only express when both copies are recessive.' }),
      newCard({ type: 'mcq', front: 'How many chromosomes does a human body cell have?', back: 'C', options: ['A. 23', 'B. 44', 'C. 46', 'D. 48'] }),
      newCard({ type: 'fill_blank', front: 'The site of photosynthesis in plant cells is the _____.', back: 'chloroplast' }),
      newCard({ type: 'flashcard', front: 'What is osmosis?', back: 'The movement of water molecules from a region of higher water concentration to a region of lower water concentration through a semi-permeable membrane' }),
      newCard({ type: 'mcq', front: 'Which blood group is the universal donor?', back: 'A', options: ['A. O', 'B. A', 'C. B', 'D. AB'] }),
    ],
  },
  {
    id: 'deck-wassce-econ-001',
    title: 'WASSCE Economics — Demand, Supply & Markets',
    subject: 'Economics',
    level: 'WASSCE',
    description: 'Core microeconomics concepts',
    createdAt: now - 1 * day,
    cards: [
      newCard({ type: 'flashcard', front: 'State the Law of Demand.', back: 'All other things being equal, as the price of a good increases, the quantity demanded decreases, and vice versa' }),
      newCard({ type: 'mcq', front: 'What happens to the supply curve when production costs increase?', back: 'B', options: ['A. Shifts right', 'B. Shifts left', 'C. Stays the same', 'D. Becomes vertical'] }),
      newCard({ type: 'fill_blank', front: 'The point where demand and supply curves meet is called the _____ price.', back: 'equilibrium' }),
      newCard({ type: 'flashcard', front: 'What is inflation?', back: 'A sustained increase in the general price level of goods and services in an economy over a period of time' }),
      newCard({ type: 'mcq', front: 'GDP stands for:', back: 'A', options: ['A. Gross Domestic Product', 'B. General Domestic Price', 'C. Gross Demand Production', 'D. General Development Plan'] }),
      newCard({ type: 'fill_blank', front: 'A market with only one seller is called a _____.', back: 'monopoly' }),
      newCard({ type: 'flashcard', front: 'What is opportunity cost?', back: 'The value of the next best alternative foregone when a choice is made. E.g. if you spend GH₵ 50 on a book instead of food, the food is the opportunity cost.' }),
      newCard({ type: 'mcq', front: 'Which is an example of a direct tax in Ghana?', back: 'C', options: ['A. VAT', 'B. Import duty', 'C. Income tax', 'D. Excise duty'] }),
    ],
  },
]

/* ═══════════════════════════════════════════════
   SAMPLE TUTOR HISTORY (for Dashboard / MyStudy)
   ═══════════════════════════════════════════════ */

export type SeedTutorEntry = {
  id: string
  subject: string
  level: string
  topic: string | null
  question: string
  language: string
  created_at: string
}

function daysAgo(d: number): string {
  return new Date(now - d * day).toISOString()
}

export const SEED_TUTOR_HISTORY: SeedTutorEntry[] = [
  { id: 'th-001', subject: 'Mathematics', level: 'BECE', topic: 'Algebra', question: 'How do I solve 2x + 5 = 13?', language: 'english', created_at: daysAgo(0) },
  { id: 'th-002', subject: 'Integrated Science', level: 'BECE', topic: 'Photosynthesis', question: 'What are the reactants and products of photosynthesis?', language: 'english', created_at: daysAgo(0) },
  { id: 'th-003', subject: 'English Language', level: 'BECE', topic: 'Essay Writing', question: 'How do I write a good introduction for my essay?', language: 'english', created_at: daysAgo(1) },
  { id: 'th-004', subject: 'Mathematics', level: 'BECE', topic: 'Geometry', question: 'Find the area of a triangle with base 10 cm and height 6 cm', language: 'english', created_at: daysAgo(1) },
  { id: 'th-005', subject: 'Physics', level: 'WASSCE', topic: 'Mechanics', question: 'Explain Newton\'s Third Law with a Ghana example', language: 'english', created_at: daysAgo(1) },
  { id: 'th-006', subject: 'Chemistry', level: 'WASSCE', topic: 'Atomic Structure', question: 'Sɛnea me tumi kyerɛ electron configuration?', language: 'twi', created_at: daysAgo(2) },
  { id: 'th-007', subject: 'Social Studies', level: 'BECE', topic: 'Ghana History', question: 'When did Ghana get independence and who led it?', language: 'english', created_at: daysAgo(2) },
  { id: 'th-008', subject: 'Biology', level: 'WASSCE', topic: 'Genetics & Heredity', question: 'How do I solve a Punnett square problem?', language: 'english', created_at: daysAgo(3) },
  { id: 'th-009', subject: 'Economics', level: 'WASSCE', topic: 'Demand & Supply', question: 'What causes a shift in the supply curve?', language: 'english', created_at: daysAgo(3) },
  { id: 'th-010', subject: 'Mathematics', level: 'WASSCE', topic: 'Trigonometry', question: 'Explain sin, cos, tan with SOH CAH TOA', language: 'english', created_at: daysAgo(4) },
  { id: 'th-011', subject: 'Physics', level: 'WASSCE', topic: 'Electricity', question: 'Calculate the resistance in a series circuit', language: 'english', created_at: daysAgo(5) },
  { id: 'th-012', subject: 'Integrated Science', level: 'BECE', topic: 'Human Body', question: 'What are the main parts of the digestive system?', language: 'english', created_at: daysAgo(5) },
  { id: 'th-013', subject: 'English Language', level: 'WASSCE', topic: 'Comprehension', question: 'How to answer inference questions in comprehension?', language: 'english', created_at: daysAgo(6) },
  { id: 'th-014', subject: 'Mathematics', level: 'BECE', topic: 'Statistics', question: 'How do I calculate the mean, median, and mode?', language: 'english', created_at: daysAgo(6) },
  { id: 'th-015', subject: 'Chemistry', level: 'WASSCE', topic: 'Organic Chemistry', question: 'What is the difference between alkanes and alkenes?', language: 'english', created_at: daysAgo(7) },
]

/* ═══════════════════════════════════════════════
   SAMPLE PRACTICE HISTORY
   ═══════════════════════════════════════════════ */

export type SeedPracticeEntry = {
  id: string
  subject: string
  level: string
  topic: string | null
  question: string
  is_correct: boolean
  created_at: string
}

export const SEED_PRACTICE_HISTORY: SeedPracticeEntry[] = [
  { id: 'ph-001', subject: 'Mathematics', level: 'BECE', topic: 'Algebra', question: 'If 3x − 7 = 8, find x.', is_correct: true, created_at: daysAgo(0) },
  { id: 'ph-002', subject: 'Mathematics', level: 'BECE', topic: 'Number & Numeration', question: 'Express 0.0035 in standard form.', is_correct: false, created_at: daysAgo(0) },
  { id: 'ph-003', subject: 'Integrated Science', level: 'BECE', topic: 'Living Things', question: 'Which organelle produces energy in the cell?', is_correct: true, created_at: daysAgo(1) },
  { id: 'ph-004', subject: 'English Language', level: 'BECE', topic: 'Grammar & Usage', question: 'Choose the correct form: "He has went / He has gone."', is_correct: true, created_at: daysAgo(1) },
  { id: 'ph-005', subject: 'Physics', level: 'WASSCE', topic: 'Mechanics', question: 'Calculate the work done when a 20 N force moves an object 5 m.', is_correct: true, created_at: daysAgo(2) },
  { id: 'ph-006', subject: 'Chemistry', level: 'WASSCE', topic: 'Chemical Bonding', question: 'What type of bond is formed between two chlorine atoms?', is_correct: false, created_at: daysAgo(2) },
  { id: 'ph-007', subject: 'Mathematics', level: 'BECE', topic: 'Geometry', question: 'Calculate the circumference of a circle with radius 7 cm.', is_correct: true, created_at: daysAgo(3) },
  { id: 'ph-008', subject: 'Social Studies', level: 'BECE', topic: 'Government & Governance', question: 'Name the three arms of government in Ghana.', is_correct: true, created_at: daysAgo(3) },
  { id: 'ph-009', subject: 'Biology', level: 'WASSCE', topic: 'Cell Biology', question: 'What is the difference between mitosis and meiosis?', is_correct: false, created_at: daysAgo(4) },
  { id: 'ph-010', subject: 'Economics', level: 'WASSCE', topic: 'Market Structures', question: 'Give two characteristics of a perfectly competitive market.', is_correct: false, created_at: daysAgo(4) },
  { id: 'ph-011', subject: 'Physics', level: 'WASSCE', topic: 'Waves & Sound', question: 'What is the speed of sound in air at room temperature?', is_correct: true, created_at: daysAgo(5) },
  { id: 'ph-012', subject: 'Mathematics', level: 'WASSCE', topic: 'Quadratic Equations', question: 'Solve x² − 5x + 6 = 0.', is_correct: false, created_at: daysAgo(5) },
  { id: 'ph-013', subject: 'Chemistry', level: 'WASSCE', topic: 'Periodicity', question: 'Why do noble gases not react easily?', is_correct: true, created_at: daysAgo(6) },
  { id: 'ph-014', subject: 'English Language', level: 'WASSCE', topic: 'Summary', question: 'Summarise the following passage in 5 sentences.', is_correct: false, created_at: daysAgo(6) },
  { id: 'ph-015', subject: 'Integrated Science', level: 'BECE', topic: 'Energy', question: 'List three forms of energy.', is_correct: true, created_at: daysAgo(7) },
  { id: 'ph-016', subject: 'Mathematics', level: 'BECE', topic: 'Probability', question: 'What is the probability of getting a head when tossing a fair coin?', is_correct: true, created_at: daysAgo(7) },
  { id: 'ph-017', subject: 'Biology', level: 'WASSCE', topic: 'Ecology', question: 'Define a food chain and give a Ghanaian example.', is_correct: true, created_at: daysAgo(7) },
  { id: 'ph-018', subject: 'Mathematics', level: 'WASSCE', topic: 'Indices', question: 'Simplify 2³ × 2⁴.', is_correct: false, created_at: daysAgo(8) },
]

/* ═══════════════════════════════════════════════
   SAMPLE STUDY SESSION
   ═══════════════════════════════════════════════ */

export const SEED_GROUP_SESSION: Omit<GroupSession, 'id'> & { id: string } = {
  id: 'session-demo-001',
  title: 'SHS3 Physics Weekend Cram',
  course: 'Physics',
  level: 'WASSCE',
  inviteCode: 'PHY2K6',
  isPublic: true,
  createdAt: now - 2 * day,
  minutesPerPage: 3,
  materials: [
    {
      id: 'mat-001',
      title: 'Newton\'s Laws of Motion',
      body: `Newton's First Law (Law of Inertia)
An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.

Example: A football on the field will not move until someone kicks it. Once kicked, it would keep moving forever if there were no friction or air resistance.

In Ghana, think about a trotro (minibus) — when it suddenly brakes, passengers lurch forward because their bodies want to keep moving.

Newton's Second Law (F = ma)
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.

Formula: F = ma, where F is force (Newtons), m is mass (kg), and a is acceleration (m/s²).

Worked example: A market woman pushes a cart of mass 50 kg with a force of 100 N. The acceleration = F/m = 100/50 = 2 m/s².

Newton's Third Law (Action-Reaction)
For every action, there is an equal and opposite reaction.

Example: When you jump, you push down on the ground (action) and the ground pushes you up (reaction). A fisherman in a canoe on the Volta River — when he pushes water backward with his paddle, the canoe moves forward.

Key formulas:
- Force: F = ma
- Weight: W = mg (g ≈ 10 m/s²)
- Momentum: p = mv
- Impulse: J = Ft = Δp
- Work: W = Fd cos θ
- Kinetic energy: KE = ½mv²
- Potential energy: PE = mgh`,
      pages: 3,
    },
    {
      id: 'mat-002',
      title: 'Electricity Basics',
      body: `Electric Current
Current is the rate of flow of electric charge. Measured in Amperes (A).
I = Q/t where Q is charge (Coulombs) and t is time (seconds).

In Ghana, the Electricity Company of Ghana (ECG) supplies current to homes at 240V.

Ohm's Law
V = IR
Voltage (V) = Current (I) × Resistance (R)

Example: If a bulb has a resistance of 60 Ω and the current flowing through it is 4 A, the voltage across it = 4 × 60 = 240 V.

Series and Parallel Circuits

Series:
- Total resistance: R_total = R₁ + R₂ + R₃
- Same current flows through all components
- Voltage is shared among components

Parallel:
- Total resistance: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃
- Same voltage across all branches
- Current is shared among branches

Power
P = IV = I²R = V²/R
Measured in Watts (W).

Cost of electricity: Energy = Power × Time
In Ghana, ECG charges per kWh. If you use a 100W bulb for 10 hours: Energy = 0.1 kW × 10 h = 1 kWh.`,
      pages: 2,
    },
  ],
  messages: [
    { id: 'msg-001', author: 'Kofi', text: 'Who is ready for physics tonight?', at: now - 2 * day },
    { id: 'msg-002', author: 'Ama', text: 'Let\'s start with mechanics! Newton\'s laws are always in the exam.', at: now - 2 * day + 60000 },
    { id: 'msg-003', author: 'You', text: 'I keep mixing up the 2nd and 3rd law. Can we go through examples?', at: now - 2 * day + 120000 },
    { id: 'msg-004', author: 'Kofi', text: 'Good idea. F=ma is the 2nd law — force equals mass times acceleration.', at: now - 2 * day + 180000 },
  ],
  annotations: [
    { id: 'ann-001', materialId: 'mat-001', page: 1, text: 'The trotro example is perfect for remembering inertia!', author: 'Ama', at: now - 2 * day + 300000 },
    { id: 'ann-002', materialId: 'mat-002', page: 1, text: 'Remember: V = IR is the most important formula in electricity.', author: 'Kofi', at: now - 1 * day },
  ],
  progressByUser: {
    'demo-user': { 'mat-001': 2, 'mat-002': 1 },
  },
  checkIns: [
    { id: 'ci-001', dueAt: now - 1 * day, response: 'on_track', note: 'Finished mechanics section' },
    { id: 'ci-002', dueAt: now + 20 * 60 * 1000 },
  ],
  revisionItems: [
    { id: 'rev-001', topic: 'Newton\'s Second Law — F=ma calculations', easiness: 2.5, interval: 1, repetitions: 1, nextReviewAt: now },
    { id: 'rev-002', topic: 'Series vs Parallel circuits', easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: now },
    { id: 'rev-003', topic: 'Ohm\'s Law calculations', easiness: 2.8, interval: 3, repetitions: 2, nextReviewAt: now + 2 * day },
  ],
}

/* ═══════════════════════════════════════════════
   SAMPLE STUDY NOTES
   ═══════════════════════════════════════════════ */

export type SeedNote = {
  id: string
  subject: string
  topic: string
  note: string
  created_at: string
}

export const SEED_NOTES: SeedNote[] = [
  { id: 'note-001', subject: 'Mathematics', topic: 'Algebra', note: 'Remember: when moving terms across the equals sign, change the sign. + becomes − and vice versa.', created_at: daysAgo(1) },
  { id: 'note-002', subject: 'Physics', topic: 'Mechanics', note: 'SOH CAH TOA: Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent', created_at: daysAgo(2) },
  { id: 'note-003', subject: 'Chemistry', topic: 'Periodic Table', note: 'Group 1 = alkali metals (Li, Na, K). They all have 1 valence electron and are very reactive.', created_at: daysAgo(3) },
  { id: 'note-004', subject: 'Biology', topic: 'Cell Biology', note: 'Plant cells have: cell wall, chloroplasts, large vacuole. Animal cells do NOT have these.', created_at: daysAgo(4) },
  { id: 'note-005', subject: 'English Language', topic: 'Essay Writing', note: 'Essay structure: Introduction (hook + thesis), 3 body paragraphs (topic sentence + evidence + explanation), Conclusion (restate + final thought).', created_at: daysAgo(5) },
]
