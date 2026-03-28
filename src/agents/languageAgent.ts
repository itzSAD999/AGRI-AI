import { agentParams, SIMPLIFY_SYSTEM_PROMPT, TWI_SYSTEM_PROMPT } from './agentConfigs'
import { callOpenRouter } from '../services/openRouterService'
import type { TutorOutput } from '../utils/outputParsers'
import type { TwiBundle } from '../utils/translationCache'

const SECTION = (title: string, body: string) => `${title}\n${body}`

function formatEnglishCard(out: TutorOutput): string {
  return [
    SECTION('EXPLANATION', out.explanation),
    SECTION('GHANA EXAMPLE', out.ghanaExample),
    SECTION(
      'KEY POINTS',
      out.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    ),
    SECTION(
      'COMMON MISTAKES',
      out.commonMistakes.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    ),
    SECTION('TEST YOURSELF', out.followUpQuestion),
  ].join('\n\n')
}

export async function runTwiAgent(out: TutorOutput): Promise<TwiBundle> {
  const raw = await callOpenRouter({
    system: TWI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate the following. Keep headers EXPLANATION, GHANA EXAMPLE, KEY POINTS, COMMON MISTAKES, TEST YOURSELF in English.\n\n${formatEnglishCard(out)}`,
      },
    ],
    maxTokens: agentParams.twi.maxTokens,
    temperature: agentParams.twi.temperature,
  })
  return parseTwiSections(raw)
}

export async function runSimplifyAgent(out: TutorOutput): Promise<string> {
  return callOpenRouter({
    system: SIMPLIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: formatEnglishCard(out),
      },
    ],
    maxTokens: agentParams.simplify.maxTokens,
    temperature: agentParams.simplify.temperature,
  })
}

function parseTwiSections(text: string): TwiBundle {
  const pick = (label: string, nextLabels: string[]) => {
    const start = text.indexOf(label)
    if (start === -1) return ''
    const rest = text.slice(start + label.length).trim()
    let end = rest.length
    for (const n of nextLabels) {
      const i = rest.indexOf(n)
      if (i !== -1 && i < end) end = i
    }
    return rest.slice(0, end).trim()
  }
  const afterIntro = text.replace(/^⚠️[^\n]*\n?/m, '').trim()
  return {
    explanation: pick('EXPLANATION', ['GHANA EXAMPLE', 'KEY POINTS']) || afterIntro,
    ghanaExample: pick('GHANA EXAMPLE', ['KEY POINTS', 'COMMON MISTAKES']),
    keyPoints: pick('KEY POINTS', ['COMMON MISTAKES', 'TEST YOURSELF'])
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean),
    commonMistakes: pick('COMMON MISTAKES', ['TEST YOURSELF'])
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean),
    followUpQuestion: pick('TEST YOURSELF', []),
  }
}

/** Translate arbitrary text to Twi via Claude. Caches nothing — caller can cache. */
export async function translateText(text: string): Promise<string> {
  return callOpenRouter({
    system: TWI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Translate to Asante Twi:\n\n${text}` }],
    maxTokens: agentParams.twi.maxTokens,
    temperature: agentParams.twi.temperature,
  })
}

/** Twi for career guidance blocks — keep section headers in English per Twi prompt rules. */
export async function runTwiGuidancePlain(block: string): Promise<string> {
  return callOpenRouter({
    system: TWI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Keep these section headers in English exactly: PROGRAMMES, CAREERS, JUSTIFICATION, CAUTIONS, NEXT STEPS.\n\n${block}`,
      },
    ],
    maxTokens: agentParams.twi.maxTokens,
    temperature: agentParams.twi.temperature,
  })
}
