import { ADVISORY_SYSTEM_PROMPT, agentParams } from './agentConfigs'
import { callOpenRouter } from '../services/openRouterService'
import { parseAdvisoryJson, type AdvisoryOutput } from '../utils/outputParsers'

export async function runAdvisoryAgent(params: {
  level: 'BECE' | 'WASSCE'
  subjects: string[]
  weeksUntilExam: number
}): Promise<AdvisoryOutput> {
  const user = `Student level: ${params.level}
Subjects (comma-separated focus): ${params.subjects.join(', ')}
Weeks until main exam: ${params.weeksUntilExam}

Return JSON study plan only.`
  const raw = await callOpenRouter({
    system: ADVISORY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.advisory.maxTokens,
    temperature: agentParams.advisory.temperature,
  })
  return parseAdvisoryJson(raw)
}
