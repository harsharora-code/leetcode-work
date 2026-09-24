import Link from "next/link"
import { ArrowRightIcon, ZapIcon, TrophyIcon, ActivityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { DifficultyBadge } from "@/components/difficulty-badge"
import { getAllProblems } from "@/lib/problems"
import type { Difficulty } from "@/lib/problems"

export default function Page() {
  const problems = getAllProblems()
  const counts: Record<Difficulty, number> = {
    Easy: problems.filter((p) => p.difficulty === "Easy").length,
    Medium: problems.filter((p) => p.difficulty === "Medium").length,
    Hard: problems.filter((p) => p.difficulty === "Hard").length,
  }
  const featured = problems.slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6 py-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <ZapIcon className="size-3.5" />
          Real-time judging over WebSocket
        </span>
        <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Sharpen your skills, one problem at a time.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Write, run, and submit solutions in a real editor. Get live verdicts
          streamed straight from the judge as soon as your code finishes running.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/problems" />}>
            Start solving
            <ArrowRightIcon />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/submissions" />}
          >
            View submissions
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 py-8 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrophyIcon className="size-4 text-muted-foreground" />
              Total Problems
            </CardTitle>
            <CardDescription>Curated classic interview questions</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {problems.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="size-4 text-muted-foreground" />
              By Difficulty
            </CardTitle>
            <CardDescription>Balanced across all levels</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm">
            <span className="text-emerald-500 dark:text-emerald-400">
              {counts.Easy} Easy
            </span>
            <span className="text-amber-500 dark:text-amber-400">
              {counts.Medium} Medium
            </span>
            <span className="text-rose-500 dark:text-rose-400">
              {counts.Hard} Hard
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon className="size-4 text-muted-foreground" />
              Languages
            </CardTitle>
            <CardDescription>Solve in your language of choice</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">3</CardContent>
        </Card>
      </section>

      {/* Featured */}
      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Featured problems</h2>
          <Link
            href="/problems"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            See all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.slug}`}>
              <Card className="transition-colors hover:ring-foreground/20">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>
                      {problem.id}. {problem.title}
                    </CardTitle>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <CardDescription>{problem.summary}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
