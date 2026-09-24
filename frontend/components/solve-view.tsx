"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  PlayIcon,
  SendIcon,
  ChevronLeftIcon,
  RotateCcwIcon,
  WifiIcon,
  WifiOffIcon,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/difficulty-badge"
import { StatusBadge } from "@/components/status-badge"
import { useSubmissionSocket } from "@/hooks/use-submission-socket"
import {
  submitSolution,
  type Language,
  type SubmissionStatus,
  type SubmitMode,
} from "@/lib/api"
import { getUserId, rememberSubmissionId } from "@/lib/user"
import type { Problem } from "@/lib/problems"

const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  }
)

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "js", label: "JavaScript" },
  { value: "cpp", label: "C++" },
]

interface RunState {
  submissionId: string | null
  status: SubmissionStatus | null
  output: string | null
  error: string | null
  submitting: boolean
  mode: SubmitMode | null
}

const initialRun: RunState = {
  submissionId: null,
  status: null,
  output: null,
  error: null,
  submitting: false,
  mode: null,
}

export function SolveView({ problem }: { problem: Problem }) {
  const { connection, subscribe } = useSubmissionSocket()
  const [language, setLanguage] = React.useState<Language>("js")
  const [code, setCode] = React.useState(problem.starterCode.js)
  const [run, setRun] = React.useState<RunState>(initialRun)
  const [bottomTab, setBottomTab] = React.useState("testcase")

  // Keep a ref to the id we're waiting on so the socket listener can match it.
  const pendingIdRef = React.useRef<string | null>(null)

  // STEP 5: handle WebSocket result events routed to this user, matching the
  // submission we're waiting on. Flow: worker -> completed_submissions ->
  // backend updates DB + publishes submission_results -> ws-server -> here.
  React.useEffect(() => {
    return subscribe((result) => {
      if (result.submissionId !== pendingIdRef.current) return
      setRun((prev) => ({
        ...prev,
        status: result.status,
        output: result.output,
        submitting: false,
      }))
      setBottomTab("result")
    })
  }, [subscribe])

  function handleLanguageChange(next: Language) {
    setLanguage(next)
    setCode(problem.starterCode[next])
  }

  function resetCode() {
    setCode(problem.starterCode[language])
  }

  // STEP 3 + 4: POST /submission, then show Processing until the ws verdict arrives.
  // mode "run" judges sample cases only; "submit" judges all (sample + hidden)
  // and is the only mode recorded in submission history.
  async function handleSubmit(mode: SubmitMode) {
    setRun({ ...initialRun, submitting: true, status: "Processing", mode })
    setBottomTab("result")
    try {
      const { id } = await submitSolution({
        userId: getUserId(),
        problemId: problem.id,
        code,
        language,
        expectedOutput: problem.examples[0]?.output ?? "",
        mode,
      })
      pendingIdRef.current = id
      if (mode === "submit") rememberSubmissionId(id)
      setRun((prev) => ({ ...prev, submissionId: id }))
    } catch (err) {
      pendingIdRef.current = null
      setRun({
        ...initialRun,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach the judge. Is the backend running?",
      })
    }
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/problems" />}
        >
          <ChevronLeftIcon />
          Problems
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            connection === "open"
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
          title={`Judge socket: ${connection}`}
        >
          {connection === "open" ? (
            <WifiIcon className="size-3.5" />
          ) : (
            <WifiOffIcon className="size-3.5" />
          )}
          {connection === "open" ? "Live" : "Connecting"}
        </span>
      </div>

      {/* Split layout */}
      <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-border/60 lg:grid-cols-2">
        {/* Left: description */}
        <div className="flex flex-col overflow-hidden bg-background">
          <ProblemPanel problem={problem} />
        </div>

        {/* Right: editor + console */}
        <div className="flex flex-col overflow-hidden bg-background">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <Select
              value={language}
              onValueChange={(v) => handleLanguageChange(v as Language)}
            >
              <SelectTrigger size="sm" className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={resetCode}
                aria-label="Reset code"
                title="Reset to starter code"
              >
                <RotateCcwIcon />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={run.submitting}
                onClick={() => handleSubmit("run")}
              >
                <PlayIcon />
                Run
              </Button>
              <Button
                size="sm"
                disabled={run.submitting}
                onClick={() => handleSubmit("submit")}
              >
                <SendIcon />
                Submit
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <CodeEditor value={code} language={language} onChange={setCode} />
          </div>

          <ConsolePanel
            problem={problem}
            run={run}
            value={bottomTab}
            onValueChange={setBottomTab}
          />
        </div>
      </div>
    </div>
  )
}

function ProblemPanel({ problem }: { problem: Problem }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs defaultValue="description" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="border-b border-border/60 px-4 py-2">
          <TabsList variant="line">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin]">
          <TabsContent value="description" className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl font-semibold">
                {problem.id}. {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <Description text={problem.description} />
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            {problem.examples.map((ex, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">Example {i + 1}</p>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs">
                  <p>
                    <span className="text-muted-foreground">Input: </span>
                    {ex.input}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Output: </span>
                    {ex.output}
                  </p>
                  {ex.explanation && (
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                      {ex.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="constraints">
            <ul className="list-inside list-disc space-y-1.5 font-mono text-xs text-muted-foreground">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

/** Renders the description text, treating `inline code` spans and paragraphs. */
function Description({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {text.split("\n\n").map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para.split(/(`[^`]+`)/g).map((part, j) =>
            part.startsWith("`") && part.endsWith("`") ? (
              <code
                key={j}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-foreground"
              >
                {part.slice(1, -1)}
              </code>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      ))}
    </div>
  )
}

function ConsolePanel({
  problem,
  run,
  value,
  onValueChange,
}: {
  problem: Problem
  run: RunState
  value: string
  onValueChange: (v: string) => void
}) {
  return (
    <div className="border-t border-border/60 bg-background">
      <Tabs value={value} onValueChange={(v) => onValueChange(v as string)} className="gap-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
          <TabsList variant="line">
            <TabsTrigger value="testcase">Testcase</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          {run.status && (
            <div className="pr-1">
              <StatusBadge status={run.status} />
            </div>
          )}
        </div>

        <div className="h-44 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
          <TabsContent value="testcase" className="space-y-2">
            {problem.examples.slice(0, 1).map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs"
              >
                <p className="text-muted-foreground">Input</p>
                <p className="mt-1">{ex.input}</p>
                <p className="mt-2 text-muted-foreground">Expected</p>
                <p className="mt-1">{ex.output}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="result">
            <ResultBody run={run} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function ResultBody({ run }: { run: RunState }) {
  if (run.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {run.error}
      </div>
    )
  }

  if (!run.status) {
    return (
      <p className="text-sm text-muted-foreground">
        Run or submit your code to see the verdict here.
      </p>
    )
  }

  if (run.status === "Processing") {
    return (
      <div className="space-y-3">
        <StatusBadge status="Processing" />
        <p className="text-xs text-muted-foreground">
          Your code is queued and running on the judge. The verdict will stream in
          over the live connection.
        </p>
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    )
  }

  const judge = parseJudge(run.output)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <StatusBadge status={run.status} />
        {run.mode && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {run.mode === "run" ? "Sample tests" : "All tests"}
          </span>
        )}
        {judge && (
          <span className="text-xs text-muted-foreground">
            Passed {judge.passed}/{judge.total} test cases
          </span>
        )}
      </div>

      {judge?.failed ? (
        <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
            Failed on test case {judge.failed.index}
          </p>
          <FailField label="Input" value={judge.failed.input} />
          <FailField label="Your output" value={judge.failed.got} />
          <FailField label="Expected" value={judge.failed.expected} />
        </div>
      ) : judge ? (
        <p className="text-sm text-emerald-500 dark:text-emerald-400">
          All test cases passed.
        </p>
      ) : run.output ? (
        <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
          {run.output}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">No output returned.</p>
      )}
    </div>
  )
}

function FailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <pre className="mt-0.5 overflow-x-auto rounded-md bg-muted/60 px-2 py-1 font-mono text-xs whitespace-pre-wrap">
        {value || "—"}
      </pre>
    </div>
  )
}

interface JudgeResult {
  ok: boolean
  passed: number
  total: number
  failed?: { index: number; input: string; expected: string; got: string }
}

/** Parse the worker's line-based judge output (see worker/judge/harness.ts). */
function parseJudge(output: string | null): JudgeResult | null {
  if (!output) return null
  const lines = output.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return null
  const first = lines[0].trim()
  if (first !== "OK" && first !== "FAILED") return null

  const kv: Record<string, string> = {}
  for (let i = 1; i < lines.length; i++) {
    const eq = lines[i].indexOf("=")
    if (eq >= 0) kv[lines[i].slice(0, eq)] = lines[i].slice(eq + 1)
  }
  const passed = Number(kv.passed ?? "0")
  const total = Number(kv.total ?? "0")

  if (first === "OK") return { ok: true, passed, total }
  return {
    ok: false,
    passed,
    total,
    failed: {
      index: Number(kv.index ?? "0"),
      input: kv.input ?? "",
      expected: kv.expected ?? "",
      got: kv.got ?? "",
    },
  }
}
