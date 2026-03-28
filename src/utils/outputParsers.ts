import { z } from 'zod'

const tutorSchema = z.object({
  explanation: z.string(),
  ghanaExample: z.string(),
  keyPoints: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  followUpQuestion: z.string(),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
})

export type TutorOutput = z.infer<typeof tutorSchema>

export function parseTutorJson(text: string): TutorOutput {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const obj = JSON.parse(cleaned) as unknown
  return tutorSchema.parse(obj)
}

const practiceSchema = z.object({
  question: z.string(),
  subject: z.string(),
  topic: z.string(),
  level: z.enum(['BECE', 'WASSCE']),
  questionType: z.enum(['multiple_choice', 'short_answer', 'structured']),
  options: z.array(z.string()).nullable(),
  marks: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
  hint: z.string(),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
})

export type PracticeQuestion = z.infer<typeof practiceSchema>

export function parsePracticeJson(text: string): PracticeQuestion {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return practiceSchema.parse(JSON.parse(cleaned) as unknown)
}

const markerSchema = z.object({
  isCorrect: z.boolean(),
  isPartialCredit: z.boolean(),
  score: z.string(),
  feedback: z.string(),
  correction: z.string(),
  whatWasRight: z.string(),
  improvement: z.string(),
  encouragement: z.string(),
})

export type MarkerOutput = z.infer<typeof markerSchema>

export function parseMarkerJson(text: string): MarkerOutput {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return markerSchema.parse(JSON.parse(cleaned) as unknown)
}

const advisorySchema = z.object({
  studyPlan: z.string(),
  prioritySubjects: z.array(z.string()),
  studyTips: z.array(z.string()),
  timeAllocation: z.string(),
  warningAreas: z.array(z.string()),
  motivationMessage: z.string(),
})

export type AdvisoryOutput = z.infer<typeof advisorySchema>

export function parseAdvisoryJson(text: string): AdvisoryOutput {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return advisorySchema.parse(JSON.parse(cleaned) as unknown)
}

const guidanceSchema = z.object({
  recommendedPrograms: z.array(
    z.object({
      name: z.string(),
      pathway: z.string(),
      reason: z.string(),
      fit: z.enum(['strong', 'good', 'stretch']),
    }),
  ),
  careerPaths: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
    }),
  ),
  justification: z.string(),
  cautions: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()),
})

export type GuidanceOutput = z.infer<typeof guidanceSchema>

export function parseGuidanceJson(text: string): GuidanceOutput {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return guidanceSchema.parse(JSON.parse(cleaned) as unknown)
}

const nlpUnderstandSchema = z.object({
  intent: z.enum([
    'tutor',
    'practice',
    'guidance',
    'advisory',
    'study_session',
    'study_hub',
    'dashboard',
    'mystudy',
    'clarify',
  ]),
  confidence: z.number().min(0).max(1),
  entities: z.object({
    subject: z.string().nullable(),
    level: z.enum(['BECE', 'WASSCE']).nullable(),
    topic: z.string().nullable(),
    question: z.string().nullable(),
    interests: z.string().nullable(),
    weeksUntilExam: z.number().int().positive().nullable(),
    sessionTitle: z.string().nullable(),
    courseName: z.string().nullable(),
    materialNotes: z.string().nullable(),
    grades: z
      .array(z.object({ subject: z.string(), grade: z.string() }))
      .nullable(),
  }),
  clarifyMessage: z.string().nullable(),
})

export type NlpUnderstandOutput = z.infer<typeof nlpUnderstandSchema>

export function parseNlpUnderstandJson(text: string): NlpUnderstandOutput {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return nlpUnderstandSchema.parse(JSON.parse(cleaned) as unknown)
}

/* ── Deck card generation ── */

const generatedCardSchema = z.object({
  type: z.enum(['flashcard', 'mcq', 'fill_blank']),
  front: z.string(),
  back: z.string(),
  options: z.array(z.string()).optional(),
})

const deckCardsSchema = z.object({
  cards: z.array(generatedCardSchema),
})

export type GeneratedCard = z.infer<typeof generatedCardSchema>

export function parseDeckCardsJson(text: string): GeneratedCard[] {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const obj = deckCardsSchema.parse(JSON.parse(cleaned) as unknown)
  return obj.cards
}
