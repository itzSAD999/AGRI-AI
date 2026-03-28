import { NLP_SYSTEM_PROMPT, agentParams } from './agentConfigs'
import { callClaude } from '../services/claudeService'
import { parseNlpUnderstandJson, type NlpUnderstandOutput } from '../utils/outputParsers'

export async function runNlpUnderstand(userMessage: string): Promise<NlpUnderstandOutput> {
  const trimmed = userMessage.trim()
  if (trimmed.length < 2) {
    return {
      intent: 'clarify',
      confidence: 0,
      entities: {
        subject: null,
        level: null,
        topic: null,
        question: null,
        interests: null,
        weeksUntilExam: null,
        sessionTitle: null,
        courseName: null,
        materialNotes: null,
        grades: null,
      },
      clarifyMessage: 'Type what you want to do — e.g. explain algebra, practice quiz, or university guidance.',
    }
  }
  const raw = await callClaude({
    system: NLP_SYSTEM_PROMPT + '\n\nThe user may write in Twi (Asante Twi). Understand Twi input and extract intent/entities just the same.',
    messages: [{ role: 'user', content: trimmed }],
    maxTokens: agentParams.nlp.maxTokens,
    temperature: agentParams.nlp.temperature,
  })
  return parseNlpUnderstandJson(raw)
}
