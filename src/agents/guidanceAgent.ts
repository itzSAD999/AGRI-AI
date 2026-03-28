import { GUIDANCE_SYSTEM_PROMPT, agentParams } from './agentConfigs'
import { callOpenRouter } from '../services/openRouterService'
import { parseGuidanceJson, type GuidanceOutput } from '../utils/outputParsers'
import type { EligibilitySummary } from '../utils/guidanceRules'

export async function runGuidanceAgent(params: {
  grades: Array<{ subject: string; grade: string }>
  interests: string
  stream?: string
  eligibility: EligibilitySummary
}): Promise<GuidanceOutput> {
  const payload = {
    grades: params.grades.filter((g) => g.subject.trim() && g.grade.trim()),
    interests: params.interests.trim() || null,
    stream: params.stream?.trim() || null,
    ruleEngine: {
      tier: params.eligibility.tier,
      bestSixAggregateSum: params.eligibility.aggregateSum,
      subjectsInAggregate: params.eligibility.subjectsCounted,
      hasF9: params.eligibility.hasF9,
      coresDetected: params.eligibility.coresPresent,
      notes: params.eligibility.ruleNotes,
    },
  }
  const user = `Student profile JSON:\n${JSON.stringify(payload, null, 2)}\n\nGenerate guidance JSON only.`
  const raw = await callOpenRouter({
    system: GUIDANCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: agentParams.guidance.maxTokens,
    temperature: agentParams.guidance.temperature,
  })
  return parseGuidanceJson(raw)
}
