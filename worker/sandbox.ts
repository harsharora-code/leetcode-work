

import { spawn } from "child_process";

const IMAGE = process.env.SANDBOX_IMAGE ?? "leetcode-sandbox:latest";
// Run-time limits (executing user code).
const MEMORY = process.env.SANDBOX_MEMORY ?? "256m";
const CPUS = process.env.SANDBOX_CPUS ?? "1.0";
const PIDS = process.env.SANDBOX_PIDS ?? "128";
const TMPFS_SIZE = process.env.SANDBOX_TMPFS ?? "32m";
const NOFILE = process.env.SANDBOX_NOFILE ?? "256";
// Max bytes any single process may write to a file (RLIMIT_FSIZE, in bytes).
const FSIZE = process.env.SANDBOX_FSIZE ?? String(32 * 1024 * 1024);
// Compiling <bits/stdc++.h> needs more headroom than running.
const COMPILE_MEMORY = process.env.SANDBOX_COMPILE_MEMORY ?? "512m";
// Cap on captured stdout+stderr. The container's memory limit does NOT bound
// this — output streams over a pipe into the worker process — so a program
// spewing endless output could balloon the worker's RAM. Kill it past this.
const MAX_OUTPUT_BYTES = Number(process.env.SANDBOX_MAX_OUTPUT_BYTES ?? 1024 * 1024);
// Prefix for every sandbox container name, used by the orphan reaper.
const NAME_PREFIX = "lc-";

export interface SandboxResult {
    code: number | null;
    timedOut: boolean;
    /** True if output exceeded MAX_OUTPUT_BYTES and the container was killed. */
    outputLimitExceeded: boolean;
    stdout: string;
    stderr: string;
}

export interface SandboxOpts {
    /** Command + args to execute inside the container. */
    cmd: string[];
    /** Wall-clock timeout in ms; on expiry the container is force-removed. */
    timeoutMs: number;
    /** Absolute host path bind-mounted at /work. */
    hostWorkDir: string;
    /** Mount /work read-write (compile) or read-only (run). */
    writable: boolean;
    /** Override the memory cap (e.g. compile needs more). */
    memory?: string;
    /** Short label used in the container name, for debugging. */
    label: string;
}

function sanitize(s: string): string {
    return s.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 40) || "job";
}

/** Run a command inside a fully sandboxed, single-use container. */
export function runInSandbox(opts: SandboxOpts): Promise<SandboxResult> {
    const name = `${NAME_PREFIX}${sanitize(opts.label)}-${process.pid}-${Date.now()}-${Math.floor(
        Math.random() * 1e6,
    )}`;
    const memory = opts.memory ?? MEMORY;
    const mount = opts.writable ? "rw" : "ro";

    const dockerArgs = [
        "run",
        "--rm",
        "--name", name,
        // --- isolation ---
        "--network", "none",
        "--user", "1001:1001",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        // --- resource limits ---
        "--memory", memory,
        "--memory-swap", memory, // equal to --memory ⇒ swap disabled
        "--cpus", CPUS,
        "--pids-limit", PIDS,
        "--ulimit", `nofile=${NOFILE}:${NOFILE}`,
        "--ulimit", `fsize=${FSIZE}:${FSIZE}`,
        "--ulimit", `nproc=${PIDS}:${PIDS}`,
        // --- filesystem ---
        "--read-only",
        "--tmpfs", `/tmp:rw,noexec,nosuid,nodev,size=${TMPFS_SIZE}`,
        "-e", "HOME=/tmp",
        "-v", `${opts.hostWorkDir}:/work:${mount}`,
        "-w", "/work",
        IMAGE,
        ...opts.cmd,
    ];

    return new Promise<SandboxResult>((resolve) => {
        const child = spawn("docker", dockerArgs);
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let outputLimitExceeded = false;
        let totalBytes = 0;
        let settled = false;

        const done = (r: Omit<SandboxResult, "timedOut" | "outputLimitExceeded">) => {
            if (settled) return;
            settled = true;
            resolve({ ...r, timedOut, outputLimitExceeded });
        };

        const forceRemove = () => {
            // Killing the docker CLI can leave the container running; force-remove it.
            spawn("docker", ["rm", "-f", name], { stdio: "ignore" });
            child.kill("SIGKILL");
        };

        const timer = setTimeout(() => {
            timedOut = true;
            forceRemove();
        }, opts.timeoutMs);

        // Append a chunk, enforcing the shared stdout+stderr byte budget. Past
        // the cap we keep only what fits, kill the container, and stop reading.
        const append = (chunk: Buffer, sink: "out" | "err") => {
            if (outputLimitExceeded) return;
            const room = MAX_OUTPUT_BYTES - totalBytes;
            if (chunk.length >= room) {
                const slice = chunk.subarray(0, Math.max(0, room)).toString();
                if (sink === "out") stdout += slice; else stderr += slice;
                totalBytes = MAX_OUTPUT_BYTES;
                outputLimitExceeded = true;
                forceRemove();
                return;
            }
            totalBytes += chunk.length;
            if (sink === "out") stdout += chunk.toString(); else stderr += chunk.toString();
        };

        child.stdout?.on("data", (c: Buffer) => append(c, "out"));
        child.stderr?.on("data", (c: Buffer) => append(c, "err"));

        child.on("error", (err) => {
            clearTimeout(timer);
            // Typically: docker not installed / not on PATH.
            done({ code: null, stdout, stderr: stderr + String(err) });
        });

        child.on("close", (code) => {
            clearTimeout(timer);
            done({ code, stdout, stderr });
        });
    });
}

/** Verify the Docker daemon is reachable and the sandbox image exists. */
export async function assertSandboxReady(): Promise<{ ok: boolean; message: string }> {
    const inspect = await new Promise<number | null>((resolve) => {
        const child = spawn("docker", ["image", "inspect", IMAGE], { stdio: "ignore" });
        child.on("error", () => resolve(null));
        child.on("close", (code) => resolve(code));
    });
    if (inspect === null) {
        return { ok: false, message: "Docker CLI not found or daemon unreachable." };
    }
    if (inspect !== 0) {
        return {
            ok: false,
            message: `Sandbox image "${IMAGE}" not found. Build it: docker build -t ${IMAGE} worker/sandbox`,
        };
    }
    return { ok: true, message: `Sandbox image "${IMAGE}" ready.` };
}

/**
 * Remove any sandbox containers left over from a previous worker crash.
 * Normal exits are covered by `--rm` and the timeout's `docker rm -f`; this is
 * a startup safety net so orphans can't accumulate and hold host resources.
 */
export async function reapOrphans(): Promise<number> {
    const ids = await new Promise<string[]>((resolve) => {
        const child = spawn("docker", ["ps", "-aq", "--filter", `name=^${NAME_PREFIX}`]);
        let out = "";
        child.stdout?.on("data", (c) => { out += c.toString(); });
        child.on("error", () => resolve([]));
        child.on("close", () => resolve(out.split("\n").map((s) => s.trim()).filter(Boolean)));
    });
    if (ids.length === 0) return 0;
    await new Promise<void>((resolve) => {
        const child = spawn("docker", ["rm", "-f", ...ids], { stdio: "ignore" });
        child.on("error", () => resolve());
        child.on("close", () => resolve());
    });
    return ids.length;
}
