import { agentParams, PRACTICE_SYSTEM_PROMPT } from './agentConfigs'
import { callClaude } from '../services/claudeService'
import {
  parseDeckCardsJson,
  parsePracticeJson,
  type GeneratedCard,
  type PracticeQuestion,
} from '../utils/outputParsers'

export async function runPracticeAgent(params: {
  subject: string
  level: 'BECE' | 'WASSCE'
  topic?: string
}): Promise<PracticeQuestion> {
  const user = `Generate ONE exam-style question.
Subject: ${params.subject}
Level: ${params.level}
${params.topic ? `Focus topic: ${params.topic}` : 'Pick an appropriate syllabus topic.'}`
  const raw = await callClaude({
    system: PRACTICE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.practice.maxTokens,
    temperature: agentParams.practice.temperature,
  })
  return parsePracticeJson(raw)
}

export async function generateDeckCards(params: {
  subject: string
  level: string
  topic?: string
  material?: string
  count?: number
  lang?: 'en' | 'twi'
}): Promise<GeneratedCard[]> {
  const count = params.count ?? 15
  const twiNote =
    params.lang === 'twi'
      ? '\n\nLANGUAGE: Write card fronts and backs in Asante Twi. Keep technical terms in English with Twi explanation in brackets. Maximum 10 words per Twi sentence.'
      : ''

  const system = [
    `You generate study cards for a Ghanaian student at the ${params.level} level.`,
    `Subject: ${params.subject}`,
    params.topic ? `Topic: ${params.topic}` : '',
    '',
    `Generate exactly ${count} study cards. Mix the following types roughly equally:`,
    '- "flashcard": A clear question on the front, concise answer on the back.',
    '- "mcq": A question with 4 options "A. …", "B. …", "C. …", "D. …". The "back" field is the correct letter (e.g. "B").',
    '- "fill_blank": A sentence with one key term replaced by "_____". The "back" field is the missing term.',
    '',
    'Requirements:',
    '- Focus on the most important concepts, definitions, formulas, and facts',
    '- For MCQs, all 4 options must be plausible',
    '- For fill-in-the-blank, the blank must be a key term, not a trivial word',
    `- Align to the GES ${params.level} syllabus`,
    '- Use Ghana-specific context where relevant',
    '',
    'Return ONLY a JSON object: { "cards": [ { "type": "...", "front": "...", "back": "...", "options": [...] }, ... ] }',
    'Do NOT include options for flashcard or fill_blank cards.',
    twiNote,
  ]
    .filter(Boolean)
    .join('\n')

  const userMsg = params.material
    ? `Generate ${count} study cards from this material:\n\n${params.material.slice(0, 12_000)}`
    : `Generate ${count} study cards covering key ${params.subject} topics for ${params.level}.${params.topic ? ` Focus on: ${params.topic}` : ''}`

  const raw = await callClaude({
    system,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 4000,
    temperature: 0.6,
  })
  return parseDeckCardsJson(raw)
}
