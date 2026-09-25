"use client"

import * as React from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Skeleton } from "@/components/ui/skeleton"
import type { Language } from "@/lib/api"

const MONACO_LANG: Record<Language, string> = {
  js: "javascript",
  cpp: "cpp",
}

interface CodeEditorProps {
  value: string
  language: Language
  onChange: (value: string) => void
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const { resolvedTheme } = useTheme()

  const handleMount: OnMount = (editor, monaco) => {
    // A dark theme tuned to the base-nova palette.
    monaco.editor.defineTheme("base-nova-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1a1a1a",
        "editor.foreground": "#fafafa",
        "editorLineNumber.foreground": "#5c5c5c",
        "editorLineNumber.activeForeground": "#a3a3a3",
        "editor.selectionBackground": "#3a3a3a",
        "editor.lineHighlightBackground": "#242424",
        "editorCursor.foreground": "#fafafa",
        "editorIndentGuide.background1": "#2a2a2a",
      },
    })
    monaco.editor.setTheme(
      resolvedTheme === "light" ? "vs" : "base-nova-dark"
    )
    editor.updateOptions({ tabSize: 2 })
  }

  return (
    <Editor
      height="100%"
      language={MONACO_LANG[language]}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      theme={resolvedTheme === "light" ? "vs" : "base-nova-dark"}
      loading={<Skeleton className="size-full rounded-none" />}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-mono), monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        padding: { top: 12, bottom: 12 },
        lineNumbersMinChars: 3,
        renderLineHighlight: "line",
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  )
}
