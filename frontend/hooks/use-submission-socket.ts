"use client"

import * as React from "react"
import { config } from "@/lib/config"
import type { SubmissionStatus } from "@/lib/api"
import { getUserId } from "@/lib/user"

export interface SubmissionResult {
  submissionId: string
  userId?: string | number
  problemId?: string
  status: SubmissionStatus
  output: string | null
}

type ConnectionState = "connecting" | "open" | "closed"

/**
 * Connects to the ws-server (see ws-server/index.ts), identifies with the
 * anonymous userId, and surfaces result messages routed to that user.
 *
 * Protocol:
 *   -> { userId }                     (client identifies once)
 *   <- { type: "subscribed", userId } (ack)
 *   <- { submissionId, userId, problemId, status, output }  (a verdict)
 */
export function useSubmissionSocket() {
  const [connection, setConnection] = React.useState<ConnectionState>("connecting")
  const [lastResult, setLastResult] = React.useState<SubmissionResult | null>(null)
  const listenersRef = React.useRef(new Set<(r: SubmissionResult) => void>())

  React.useEffect(() => {
    const userId = getUserId()
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByUs = false

    function connect() {
      setConnection("connecting")
      try {
        ws = new WebSocket(config.wsUrl)
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        setConnection("open")
        ws?.send(JSON.stringify({ userId }))
      }

      ws.onmessage = (event) => {
        let payload: unknown
        try {
          payload = JSON.parse(String(event.data))
        } catch {
          return
        }
        if (
          payload &&
          typeof payload === "object" &&
          "submissionId" in payload
        ) {
          const result = payload as SubmissionResult
          setLastResult(result)
          listenersRef.current.forEach((fn) => fn(result))
        }
      }

      ws.onclose = () => {
        setConnection("closed")
        if (!closedByUs) scheduleReconnect()
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    function scheduleReconnect() {
      if (reconnectTimer) return
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, 2000)
    }

    connect()

    return () => {
      closedByUs = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])

  /** Subscribe to every incoming result; returns an unsubscribe fn. */
  const subscribe = React.useCallback(
    (fn: (r: SubmissionResult) => void) => {
      listenersRef.current.add(fn)
      return () => {
        listenersRef.current.delete(fn)
      }
    },
    []
  )

  return { connection, lastResult, subscribe }
}
