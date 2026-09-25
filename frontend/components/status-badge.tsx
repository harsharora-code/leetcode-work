import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  LoaderIcon,
} from "lucide-react"
import { cn } from "cn"
import type { SubmissionStatus } from "@/lib/api"

const config: Record<
  SubmissionStatus,
  { label: string; className: string; icon: React.ElementType; spin?: boolean }
> = {
  Processing: {
    label: "Processing",
    className: "text-amber-500 dark:text-amber-400",
    icon: LoaderIcon,
    spin: true,
  },
  Success: {
    label: "Accepted",
    className: "text-emerald-500 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  Failure: {
    label: "Wrong Answer",
    className: "text-rose-500 dark:text-rose-400",
    icon: XCircleIcon,
  },
  TLE: {
    label: "Time Limit Exceeded",
    className: "text-rose-500 dark:text-rose-400",
    icon: ClockIcon,
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus
  className?: string
}) {
  const { label, className: color, icon: Icon, spin } = config[status]
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm font-medium", color, className)}
    >
      <Icon className={cn("size-4", spin && "animate-spin")} />
      {label}
    </span>
  )
}

export { config as statusConfig }
