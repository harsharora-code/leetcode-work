import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SolveView } from "@/components/solve-view"
import { getAllProblems, getProblemBySlug } from "@/lib/problems"

export function generateStaticParams() {
  return getAllProblems().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  props: PageProps<"/problems/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const problem = getProblemBySlug(slug)
  return { title: problem ? problem.title : "Problem" }
}

export default async function ProblemPage(props: PageProps<"/problems/[slug]">) {
  const { slug } = await props.params
  const problem = getProblemBySlug(slug)

  if (!problem) notFound()

  return <SolveView problem={problem} />
}
