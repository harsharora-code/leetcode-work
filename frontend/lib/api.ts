import { config } from "./config"

export type SubmissionStatus = "Processing" | "Success" | "Failure" | "TLE"

export type Language = "js" | "cpp"


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


export async function getSubmission(id: string): Promise<Submission | null> {
  const res = await fetch(`${config.apiUrl}/submission/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to load submission (${res.status})`)
  }
  const data = (await res.json()) as { submission: Submission | null }
  return data.submission
}
