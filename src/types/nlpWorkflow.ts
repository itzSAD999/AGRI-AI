/** Passed through React Router location.state after NLP routing */
export type NlpWorkflowPayload = {
  question?: string
  subject?: string
  level?: 'BECE' | 'WASSCE'
  topic?: string
  interests?: string
  weeksUntilExam?: number
  subjectList?: string[]
  sessionTitle?: string
  courseName?: string
  materialNotes?: string
  grades?: Array<{ subject: string; grade: string }>
  assistantMessage?: string
  rawUserText?: string
}

export type AppLocationState = {
  nlp?: NlpWorkflowPayload
}
