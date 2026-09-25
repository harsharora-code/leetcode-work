"use client"

import * as React from "react"
import Link from "next/link"
import { InboxIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/status-badge"
import { getSubmission, type Submission } from "@/lib/api"
import { getSubmissionIds } from "@/lib/user"
import { getAllProblems } from "@/lib/problems"

const problemsById = new Map(getAllProblems().map((p) => [p.id, p]))
const LANG_LABEL: Record<string, string> = {
  js: "JavaScript",
  cpp: "C++",
}

export function SubmissionsList() {
  const [loading, setLoading] = React.useState(true)
  const [submissions, setSubmissions] = React.useState<Submission[]>([])
  const [error, setError] = React.useState<string | null>(null)
  // Bumped by the refresh/retry buttons to re-run the fetch effect.
  const [reloadKey, setReloadKey] = React.useState(0)

  // Fetch on mount and whenever `reloadKey` changes. All state updates run
  // asynchronously (after the await) and are guarded by `ignore` so a stale
  // request can't clobber a newer one.
  React.useEffect(() => {
    let ignore = false
    const ids = getSubmissionIds()
    Promise.all(ids.map((id) => getSubmission(id).catch(() => null)))
      .then((results) => {
        if (ignore) return
        setSubmissions(results.filter((s): s is Submission => s !== null))
        setError(null)
      })
      .catch(() => {
        if (!ignore) setError("Could not load submissions. Is the backend running?")
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  // Button-triggered refresh/retry: safe to set state synchronously here since
  // this runs in an event handler, not an effect.
  const reload = React.useCallback(() => {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
          Retry
        </Button>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <InboxIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm text-muted-foreground">
            Solve a problem to see your submission history here.
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/problems" />}>
          Browse problems
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={reload}>
          Refresh
        </Button>
      </div>
      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-32">Language</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => {
              const problem = problemsById.get(sub.problemId)
              return (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {problem ? (
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="hover:text-primary hover:underline"
                      >
                        {problem.id}. {problem.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        Problem {sub.problemId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {LANG_LABEL[sub.language] ?? sub.language}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
