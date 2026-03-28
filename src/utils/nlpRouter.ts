import type { NavigateFunction } from 'react-router-dom'
import type { NlpUnderstandOutput } from '../utils/outputParsers'
import type { NlpWorkflowPayload } from '../types/nlpWorkflow'
import { normalizeWassceGrade } from './gradeNormalize'
import { matchGuidanceSubjectName } from './guidanceSubjectMatch'

export function navigateFromNlpResult(
  navigate: NavigateFunction,
  parsed: NlpUnderstandOutput,
  rawUserText: string,
): { clarify: string | null } {
  const e = parsed.entities

  if (parsed.intent === 'clarify') {
    return {
      clarify:
        parsed.clarifyMessage?.trim() ||
        'Say a bit more — for example which subject, BECE or WASSCE, or what you want to do next.',
    }
  }

  const base: NlpWorkflowPayload = {
    rawUserText: rawUserText,
    assistantMessage: parsed.clarifyMessage ?? undefined,
  }

  const grades =
    e.grades?.map((g) => ({
      subject: matchGuidanceSubjectName(g.subject),
      grade: normalizeWassceGrade(g.grade),
    })) ?? undefined

  const subjectList = e.subject
    ? [e.subject]
    : grades?.map((g) => g.subject).filter(Boolean)

  switch (parsed.intent) {
    case 'tutor': {
      const nlp: NlpWorkflowPayload = {
        ...base,
        question: e.question?.trim() || rawUserText,
        subject: e.subject ?? undefined,
        level: e.level ?? undefined,
        topic: e.topic ?? undefined,
      }
      navigate('/app/tutor', { state: { nlp } })
      return { clarify: null }
    }
    case 'practice': {
      const nlp: NlpWorkflowPayload = {
        ...base,
        subject: e.subject ?? undefined,
        level: e.level ?? undefined,
        topic: e.topic ?? undefined,
      }
      navigate('/app/practice', { state: { nlp } })
      return { clarify: null }
    }
    case 'guidance': {
      const nlp: NlpWorkflowPayload = {
        ...base,
        interests: e.interests ?? undefined,
        grades: grades && grades.length > 0 ? grades : undefined,
      }
      navigate('/app/guidance', { state: { nlp } })
      return { clarify: null }
    }
    case 'advisory': {
      const nlp: NlpWorkflowPayload = {
        ...base,
        weeksUntilExam: e.weeksUntilExam ?? undefined,
        interests: e.interests ?? undefined,
        subjectList: subjectList && subjectList.length > 0 ? subjectList : undefined,
        level: e.level ?? undefined,
      }
      navigate('/app/advisory', { state: { nlp } })
      return { clarify: null }
    }
    case 'study_session': {
      const nlp: NlpWorkflowPayload = {
        ...base,
        sessionTitle: e.sessionTitle?.trim() || undefined,
        courseName: e.courseName?.trim() || e.subject?.trim() || undefined,
        materialNotes: e.materialNotes?.trim() || undefined,
        level: e.level ?? undefined,
      }
      navigate('/app/studyg/sessions/new', { state: { nlp } })
      return { clarify: null }
    }
    case 'study_hub':
      navigate('/app/studyg')
      return { clarify: null }
    case 'dashboard':
      navigate('/app/dashboard')
      return { clarify: null }
    case 'mystudy':
      navigate('/app/mystudy')
      return { clarify: null }
    default:
      return { clarify: 'Try asking for help with a subject, a quiz, career guidance, or a study session.' }
  }
}
