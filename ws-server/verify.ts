
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";
const WS_URL = process.env.WS_URL ?? "ws://localhost:8080/ws";
const mode = process.argv[2] ?? "js";
const userId = "test-user-1";

// const samples: Record<string, { language: string; code: string }> = {
//     js: { language: "js", code: `console.log("hello from js")` },
//     cpp: { language: "cpp", code: `#include <iostream>\nint main(){ std::cout << "hello from cpp"; }` },
//     tle: { language: "js", code: `while (true) {}` },
// };
const sample = samples[mode] ?? samples.js!;

const ws = new WebSocket(WS_URL);
let submissionId: string | null = null;

ws.onopen = () => {
    ws.send(JSON.stringify({ userId }));
};

ws.onmessage = async (ev) => {
    const msg = JSON.parse(String(ev.data));

    // ack from the ws-server → now safe to submit.
    if (msg.type === "subscribed") {
        const res = await fetch(`${BACKEND}/submission`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...sample, userId, problemId: "1" }),
        });
        const body = (await res.json()) as { id: string };
        submissionId = body.id;
        console.log("submitted, submissionId:", submissionId);
        return;
    }

    // a result for this user — keep only the one matching our submission.
    if (msg.submissionId === submissionId) {
        console.log("RESULT:", ev.data);
        ws.close();
        process.exit(0);
    }
};

ws.onerror = (e) => {
    console.error("ws error", e);
    process.exit(1);
};
setTimeout(() => {
    console.error("timeout: no result in 15s");
    process.exit(1);
}, 15000);
