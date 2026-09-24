"use client"

import * as React from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DifficultyBadge } from "@/components/difficulty-badge"
import type { Difficulty, Problem } from "@/lib/problems"

interface ProblemsTableProps {
  problems: Problem[]
  tags: string[]
}

const DIFFICULTIES: (Difficulty | "All")[] = ["All", "Easy", "Medium", "Hard"]

export function ProblemsTable({ problems, tags }: ProblemsTableProps) {
  const [query, setQuery] = React.useState("")
  const [difficulty, setDifficulty] = React.useState<string>("All")
  const [tag, setTag] = React.useState<string>("All")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return problems.filter((p) => {
      if (difficulty !== "All" && p.difficulty !== difficulty) return false
      if (tag !== "All" && !p.tags.includes(tag)) return false
      if (q && !p.title.toLowerCase().includes(q) && !p.id.includes(q))
        return false
      return true
    })
  }, [problems, query, difficulty, tag])

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as string)}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d} value={d}>
                {d === "All" ? "All difficulties" : d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={(v) => setTag(v as string)}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All topics</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-32">Difficulty</TableHead>
              <TableHead className="hidden md:table-cell">Topics</TableHead>
              <TableHead className="w-28 text-right">Acceptance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No problems match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((problem) => (
                <TableRow key={problem.id} className="group">
                  <TableCell className="text-muted-foreground">
                    {problem.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {problem.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {problem.acceptance.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {problems.length} problems
      </p>
    </div>
  )
}
