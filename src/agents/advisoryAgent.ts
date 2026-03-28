import { ADVISORY_SYSTEM_PROMPT, agentParams } from './agentConfigs'
import { callClaude } from '../services/claudeService'
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
  const raw = await callClaude({
    system: ADVISORY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.advisory.maxTokens,
    temperature: agentParams.advisory.temperature,
  })
  return parseAdvisoryJson(raw)
}
