import { agentParams, MARKER_SYSTEM_PROMPT } from './agentConfigs'
import { callOpenRouter } from '../services/openRouterService'
import { parseMarkerJson, type MarkerOutput } from '../utils/outputParsers'
import type { PracticeQuestion } from '../utils/outputParsers'

export async function runMarkerAgent(params: {
  q: PracticeQuestion
  studentAnswer: string
}): Promise<MarkerOutput> {
  const user = `Question (${params.q.level}, ${params.q.subject}, ${params.q.marks} marks):
${params.q.question}

${
  params.q.questionType === 'multiple_choice' && params.q.options
    ? `Options:\n${params.q.options.join('\n')}\n`
    : ''
}
Student answer:
${params.studentAnswer}

Mark fairly. JSON only.`
  const raw = await callOpenRouter({
    system: MARKER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.marker.maxTokens,
    temperature: agentParams.marker.temperature,
  })
  return parseMarkerJson(raw)
}
