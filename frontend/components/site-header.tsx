"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CodeXmlIcon } from "lucide-react"
import { cn } from "cn"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const nav = [
  { href: "/problems", label: "Problems" },
  { href: "/submissions", label: "Submissions" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CodeXmlIcon className="size-4" />
          </span>
          <span>NexCode</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Avatar>
            <AvatarFallback>HA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
