import { config } from "./config"

/** Mirrors the Prisma `SubmissionStatus` enum in backend/prisma/schema.prisma. */
export type SubmissionStatus = "Processing" | "Success" | "Failure" | "TLE"

/** Must match the ids the worker switches on (worker/index.ts): "js" | "cpp". */
export type Language = "js" | "cpp"

/** "run" judges sample cases only; "submit" judges sample + hidden cases. */
export type SubmitMode = "run" | "submit"

export interface Submission {
  id: string
  userId: string
  problemId: string
  code: string
  language: string
  status: SubmissionStatus
  output: string | null
  expectedOutput?: string
}

export interface SubmitInput {
  userId: string
  problemId: string
  code: string
  language: Language
  expectedOutput: string
  mode: SubmitMode
}

export interface SubmitResponse {
  message: string
  id: string
}

/** POST /submission — enqueues code for judging, returns the new submission id. */
export async function submitSolution(input: SubmitInput): Promise<SubmitResponse> {
  const res = await fetch(`${config.apiUrl}/submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Submission failed (${res.status})`)
  }
  return (await res.json()) as SubmitResponse
}

/** GET /submission/:id — fetches the current state of a submission. */
export async function getSubmission(id: string): Promise<Submission | null> {
  const res = await fetch(`${config.apiUrl}/submission/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to load submission (${res.status})`)
  }
  const data = (await res.json()) as { submission: Submission | null }
  return data.submission
}
