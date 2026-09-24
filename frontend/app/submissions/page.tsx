import type { Metadata } from "next"
import { SubmissionsList } from "@/components/submissions-list"

export const metadata: Metadata = {
  title: "Submissions",
}

export default function SubmissionsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Submissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Your recent submissions, judged live and stored on the backend.
        </p>
      </div>
      <SubmissionsList />
    </div>
  )
}
