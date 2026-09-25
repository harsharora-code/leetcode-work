import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import type { Difficulty } from "@/lib/problems"

const styles: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  Medium: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  Hard: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty
  className?: string
}) {
  return (
    <Badge className={cn("border-transparent", styles[difficulty], className)}>
      {difficulty}
    </Badge>
  )
}
