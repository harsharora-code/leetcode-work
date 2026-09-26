import { createClient } from "redis";
import fs from "fs/promises";
import path from "path";
import { getProblemSpec, getTestsForMode } from "./judge/testcases.ts";
import { buildJs, buildCpp } from "./judge/harness.ts";
import { runInSandbox, assertSandboxReady, reapOrphans } from "./sandbox.ts";

type Mode = "run" | "submit";

const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS ?? 5000);
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 10000);

const JOBS_QUEUE = "problems";
const COMPLETED_QUEUE = "completed_results";

type Status = "Success" | "Failure" | "TLE";

async function runCode(problemId: string, language: string, code: string, submissionId: string, mode: Mode): Promise<{ status: Status; output: string }> {
    const spec = getProblemSpec(problemId);
    const tests = spec ? getTestsForMode(spec, mode) : [];
    const workDir = path.resolve(__dirname, "code", submissionId);
    await fs.mkdir(workDir, { recursive: true });
    // The sandbox container runs as uid 1001; make the mounted dir writable to
    // it so g++ can emit the binary, and so the host can clean it up after.
    await fs.chmod(workDir, 0o777).catch(() => {});

    try {
        if (language === "cpp") {
            // With a spec, wrap the user's function in a generated driver that
            // runs the mode's test cases; otherwise run the submission as-is.
            const program = spec ? buildCpp(spec, tests, code) : code;
            await fs.writeFile(path.join(workDir, "main.cpp"), program);

            // Compile inside the sandbox: /work read-write so g++ can write the
            // ELF binary (always "main" — compilation happens in the Linux image).
            const compile = await runInSandbox({
                cmd: ["g++", "-O2", "-std=c++17", "/work/main.cpp", "-o", "/work/main"],
                timeoutMs: COMPILE_TIMEOUT_MS,
                hostWorkDir: workDir,
                writable: true,
                memory: process.env.SANDBOX_COMPILE_MEMORY ?? "512m",
                label: `cc-${submissionId}`,
            });
            if (compile.timedOut) return { status: "TLE", output: "Compilation timed out" };
            if (compile.outputLimitExceeded) return { status: "Failure", output: "Compiler output limit exceeded" };
            if (compile.code !== 0) return { status: "Failure", output: compile.stderr || "Compilation failed" };

            // Execute inside the sandbox: /work read-only, tighter memory cap.
            const run = await runInSandbox({
                cmd: ["/work/main"],
                timeoutMs: RUN_TIMEOUT_MS,
                hostWorkDir: workDir,
                writable: false,
                label: `run-${submissionId}`,
            });
            if (run.timedOut) return { status: "TLE", output: run.stdout || "Time limit exceeded" };
            if (run.outputLimitExceeded) return { status: "Failure", output: (run.stdout || "") + "\n[output limit exceeded]" };
            if (run.code !== 0) return { status: "Failure", output: run.stdout || run.stderr };
            return { status: "Success", output: run.stdout };
        }

        if (language === "js") {
            const program = spec ? buildJs(spec, tests, code) : code;
            await fs.writeFile(path.join(workDir, "main.js"), program);

            const run = await runInSandbox({
                cmd: ["node", "/work/main.js"],
                timeoutMs: RUN_TIMEOUT_MS,
                hostWorkDir: workDir,
                writable: false,
                label: `run-${submissionId}`,
            });
            if (run.timedOut) return { status: "TLE", output: run.stdout || "Time limit exceeded" };
            if (run.outputLimitExceeded) return { status: "Failure", output: (run.stdout || "") + "\n[output limit exceeded]" };
            if (run.code !== 0) return { status: "Failure", output: run.stdout || run.stderr };
            return { status: "Success", output: run.stdout };
        }

        return { status: "Failure", output: `Unsupported language: ${language}` };
    } finally {
        await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
}
//here we start worker to run + judge and  publish them.
// Redis connection is configurable for production; defaults to localhost for dev.
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const client = createClient({ url: REDIS_URL });
// Without an error listener, a connection drop throws an unhandled error and
// crashes the worker; log instead and let node-redis reconnect.
client.on("error", (err) => console.error("[redis] client error:", err));

client.connect().then(async () => {
    console.log(`Worker ${process.pid} started`);

    // Fail closed: never fall back to executing untrusted code on the host.
    const sandbox = await assertSandboxReady();
    if (!sandbox.ok) {
        console.error(`[sandbox] ${sandbox.message}`);
        console.error("[sandbox] Refusing to start without a working sandbox. Exiting.");
        await client.quit().catch(() => {});
        process.exit(1);
    }
    console.log(`[sandbox] ${sandbox.message}`);

    // Clear any containers orphaned by a previous crash before taking work.
    const reaped = await reapOrphans();
    if (reaped > 0) console.log(`[sandbox] reaped ${reaped} orphaned container(s)`);

    while (true) {
        const response = await client.brPop(JOBS_QUEUE, 0);
        if (!response) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }
        try {
            const { submissionId, problemId, code, language, mode } = JSON.parse(response.element);
            const runMode: Mode = mode === "run" ? "run" : "submit";
            console.log(`Worker ${process.pid} got submission ${submissionId} (problem ${problemId}, ${language}, ${runMode})`);

            const result = await runCode(problemId, language, code, submissionId, runMode);
            // await new Promise((r) => setTimeout(r, 3000));

            // await prisma.submissions.update({
            //     where: {id : submissionId},
            //     data: {status: result.status, output: result.output}
            // });
                // await new Promise((r) => setTimeout(r, 5000));
            // await client.publish(
            //     "submission_results",
            //     JSON.stringify({ 
            //         submissionId,
            //         userId,
            //         problemId, 
            //         status: result.status, 
            //         output: result.output 
            //     }),
            // );
            await client.lPush(COMPLETED_QUEUE, JSON.stringify({submissionId, status: result.status, output: result.output}))

            console.log(`Worker ${process.pid} finished submission ${submissionId}: ${result.status}`);
        } catch (err) {
            console.error(`Worker ${process.pid} failed:`, err);
        }
    }
});
