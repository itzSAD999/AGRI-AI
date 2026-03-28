import { agentParams, TUTOR_SYSTEM_PROMPT } from './agentConfigs'
import { callOpenRouter } from '../services/openRouterService'
import { parseTutorJson, type TutorOutput } from '../utils/outputParsers'

export async function runTutorAgent(params: {
  subject: string
  level: 'BECE' | 'WASSCE'
  topic?: string
  question: string
}): Promise<TutorOutput> {
  const user = `Subject: ${params.subject}
Level: ${params.level}
${params.topic ? `Topic: ${params.topic}\n` : ''}
Student question:
${params.question}`
  const raw = await callOpenRouter({
    system: TUTOR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.tutor.maxTokens,
    temperature: agentParams.tutor.temperature,
  })
  return parseTutorJson(raw)
}

export async function runTutorChat(params: {
  level: string
  subject: string
  topic?: string
  goals?: string
  lang?: 'en' | 'twi'
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<string> {
  const { level, subject, topic, goals, lang, messages } = params

  const twiBlock =
    lang === 'twi'
      ? [
          '',
          'LANGUAGE: Respond in Asante Twi.',
          '- Keep technical/subject-specific terms in English with Twi explanation in brackets.',
          '- Maximum 10 words per Twi sentence.',
          '- Use warm tone like an older sibling.',
          '- If unsure of a Twi word, use the English word — never guess.',
          '- The student may also type in Twi — understand and respond in Twi.',
        ].join('\n')
      : ''

  const system = [
    `You are a friendly, patient AI tutor helping a Ghanaian student prepare for their ${level} exam.`,
    `Subject: ${subject}`,
    topic ? `Current topic: ${topic}` : '',
    goals ? `\nStudent's learning goals:\n${goals}` : '',
    '',
    'Teaching approach:',
    '- Be warm, encouraging, and conversational — like the best teacher they have ever had',
    '- Use Ghana-specific examples (GH₵, local places, Ghanaian names, everyday life in Ghana)',
    `- Align all content strictly to the GES ${level} syllabus`,
    '- Break complex ideas into small, clear steps',
    '- After explaining a concept, ask a quick check question to test understanding',
    '- If the student answers wrong, guide them with hints before revealing the answer',
    '- Celebrate correct answers enthusiastically (e.g. "Exactly!", "Well done!")',
    '- Adapt difficulty based on student responses — go simpler if they struggle, deeper if they are ready',
    '- Keep each response focused — avoid overwhelming walls of text',
    '- Use **bold** for key terms and numbered lists for steps',
    `- Relate content to how it might appear in ${level} exams`,
    '- Periodically summarise what has been covered in the session',
    '- If the student asks for a quiz, generate 1-3 exam-style questions and mark their answers',
    '',
    'Never fabricate facts. If you are unsure about something, say so honestly.',
    twiBlock,
  ]
    .filter(Boolean)
    .join('\n')

  return callOpenRouter({
    system,
    messages,
    maxTokens: 1500,
    temperature: 0.7,
  })
}
