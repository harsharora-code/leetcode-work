import type { Metadata } from "next"
import { ProblemsTable } from "@/components/problems-table"
import { getAllProblems, getAllTags } from "@/lib/problems"

export const metadata: Metadata = {
  title: "Problems",
}

export default function ProblemsPage() {
  const problems = getAllProblems()
  const tags = getAllTags()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Problems
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a problem and start coding. Solutions are judged live.
        </p>
      </div>
      <ProblemsTable problems={problems} tags={tags} />
    </div>
  )
}
