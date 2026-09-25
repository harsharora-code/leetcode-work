import { createClient } from "redis";
import type { ServerWebSocket } from "bun";

// Hosts like Render inject PORT; prefer WS_PORT, then PORT, then the dev default.
const PORT = Number(process.env.WS_PORT ?? process.env.PORT ?? 8081);
const RESULTS_CHANNEL = "submission_results";

type WSData = { userId: string | null };

// userId -> the sockets belonging to that user (a user may have several tabs open)
const userSockets = new Map<string, Set<ServerWebSocket<WSData>>>();

// Redis connection is configurable for production; defaults to localhost for dev.
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const subscriber = createClient({ url: REDIS_URL });
// Log connection errors so a drop doesn't crash the process with an unhandled error.
subscriber.on("error", (err) => console.error("[redis] subscriber error:", err));
await subscriber.connect();


await subscriber.subscribe(RESULTS_CHANNEL, (message) => {
    console.log("received Redis result:", message);
    let payload: { userId?: string | number };
    try {
        payload = JSON.parse(message);
    } catch {
        return;
    }
    if (payload.userId === undefined) return;

    const sockets = userSockets.get(String(payload.userId));
    if (!sockets) return; // that user isn't connected right now — nothing to deliver..

    for (const ws of sockets) {
        try {
            ws.send(message); // forward the raw JSON straight through
        } catch {
            /* socket already gone; the close handler cleans it up */
        }
    }
});

const server = Bun.serve<WSData>({
    port: PORT,

    fetch(req, server) {
        const url = new URL(req.url);
        if (url.pathname === "/health") return new Response("ok");
        if (url.pathname === "/ws") {
            if (server.upgrade(req, { data: { userId: null } })) return;
            return new Response("Expected WebSocket", { status: 426 });
        }
        return new Response("Not found", { status: 404 });
    },
    websocket: {
            message(ws, raw) {
            if (ws.data.userId) return; // already identified

            let msg: { userId?: string | number };
            try {
                msg = JSON.parse(String(raw));
            } catch {
                return;
            }
            if (msg.userId === undefined) return;

            const key = String(msg.userId);
            ws.data.userId = key;

            let set = userSockets.get(key);
            if (!set) {
                set = new Set();
                userSockets.set(key, set);
            }
            set.add(ws);

            ws.send(JSON.stringify({ type: "subscribed", userId: key }));
            console.log(`user ${key} connected (${set.size} socket(s))`);
        },
        close(ws) {
            const key = ws.data.userId;
            if (!key) return;
            const set = userSockets.get(key);
            if (!set) return;
            set.delete(ws);
            if (set.size === 0) userSockets.delete(key);
        },
    },
});

console.log(`ws-server on :${server.port}, subscribed to "${RESULTS_CHANNEL}"`);