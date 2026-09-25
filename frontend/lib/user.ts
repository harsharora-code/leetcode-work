"use client"

const USER_KEY = "lc_user_id"

/**
 * Returns a stable anonymous user id, persisted in localStorage.
 * The backend accepts an arbitrary userId string (no auth exists yet),
 * and the ws-server routes result messages by this same id.
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "anonymous"

  let id = window.localStorage.getItem(USER_KEY)
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `user_${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(USER_KEY, id)
  }
  return id
}

const SUBMISSIONS_KEY = "lc_submission_ids"

/** Local log of submission ids this browser has created, newest first. */
export function getSubmissionIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function rememberSubmissionId(id: string) {
  if (typeof window === "undefined") return
  const ids = getSubmissionIds().filter((existing) => existing !== id)
  ids.unshift(id)
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(ids.slice(0, 100)))
}
