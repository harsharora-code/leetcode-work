/*
 * Sandbox — runs untrusted user code inside a locked-down Docker container.
 *
 * SECURITY: The worker must NEVER execute submitted C++/JS directly on the
 * host. Every compile and run goes through `runInSandbox`, which shells out to
 * `docker run` with a deny-by-default profile:
 *
 *   --network none                  no network access at all
 *   --user 1001:1001                non-root (also baked into the image)
 *   --cap-drop ALL                  drop every Linux capability
 *   --security-opt no-new-privileges  no setuid escalation
 *   --read-only                     read-only root filesystem
 *   --tmpfs /tmp (noexec,nosuid)    only writable scratch, size-capped
 *   --memory / --memory-swap        RAM cap, swap disabled
 *   --cpus                          CPU cap
 *   --pids-limit                    process/thread cap (fork-bomb guard)
 *   --ulimit fsize/nofile/nproc     disk-write, fd and process rlimits
 *   -v <workdir>:/work[:ro]         only the submission dir is visible
 *
 * The wall-clock timeout is enforced host-side: on expiry we `docker rm -f`
 * the container (killing the CLI alone can orphan it).
 *
 * There is intentionally no fallback to host execution. If Docker or the image
 * is unavailable, submissions fail closed (see the worker's startup check).
 */

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

export interface SandboxResult {
    code: number | null;
    timedOut: boolean;
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
    const name = `lc-${sanitize(opts.label)}-${process.pid}-${Date.now()}-${Math.floor(
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
        let settled = false;

        const done = (r: SandboxResult) => {
            if (settled) return;
            settled = true;
            resolve(r);
        };

        const timer = setTimeout(() => {
            timedOut = true;
            // Killing the docker CLI can leave the container running; force-remove it.
            spawn("docker", ["rm", "-f", name], { stdio: "ignore" });
            child.kill("SIGKILL");
        }, opts.timeoutMs);

        child.stdout?.on("data", (c) => { stdout += c.toString(); });
        child.stderr?.on("data", (c) => { stderr += c.toString(); });

        child.on("error", (err) => {
            clearTimeout(timer);
            // Typically: docker not installed / not on PATH.
            done({ code: null, timedOut, stdout, stderr: stderr + String(err) });
        });

        child.on("close", (code) => {
            clearTimeout(timer);
            done({ code, timedOut, stdout, stderr });
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
