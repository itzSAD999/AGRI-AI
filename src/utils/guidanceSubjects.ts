/** Common WASSCE subject labels for guidance input (not exhaustive). */
export const GUIDANCE_SUBJECT_OPTIONS = [
  'English Language',
  'Core Mathematics',
  'Integrated Science',
  'Social Studies',
  'Elective Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Business Management',
  'Financial Accounting',
  'Literature in English',
  'History',
  'Geography',
  'Government',
  'French',
  'ICT',
  'General Knowledge in Art',
  'Textiles',
  'Food & Nutrition',
  'Agricultural Science',
] as const

export type GuidanceSubjectOption = (typeof GUIDANCE_SUBJECT_OPTIONS)[number]
