import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      <div className="border-b border-border/60 px-4 py-2">
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-px bg-border/60 lg:grid-cols-2">
        <div className="space-y-4 bg-background p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="bg-background p-6">
          <Skeleton className="size-full" />
        </div>
      </div>
    </div>
  )
}
