export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8081/ws",
} as const
