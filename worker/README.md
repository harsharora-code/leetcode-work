# worker

Judge worker. Pulls submissions off the Redis `problems` queue, runs them, and
pushes verdicts to `completed_results`.

## Security model — untrusted code is sandboxed

User submissions are **never executed on the host**. Every compile and run
happens inside a single-use Docker container (`worker/sandbox.ts`) started with
a deny-by-default profile:

- `--network none` — no network access
- `--user 1001:1001` + `--cap-drop ALL` + `--security-opt no-new-privileges` — non-root, no capabilities, no privilege escalation
- `--read-only` root filesystem; the only writable spot is a size-capped `--tmpfs /tmp` (`noexec,nosuid,nodev`)
- `--memory`/`--memory-swap` (swap disabled), `--cpus`, `--pids-limit` — RAM, CPU and process/thread caps
- `--ulimit fsize/nofile/nproc` — disk-write, file-descriptor and process rlimits
- only the submission's own directory is bind-mounted at `/work` (read-only while executing)
- a host-side wall-clock timeout `docker rm -f`s the container on expiry
- captured stdout+stderr is byte-capped (`SANDBOX_MAX_OUTPUT_BYTES`) — the container's memory limit doesn't bound output that streams to the worker, so a flooding program is killed
- orphaned sandbox containers from a prior crash are reaped on startup

If Docker or the sandbox image is missing, the worker **refuses to start** — it
never falls back to running code on the host.

### Setup

Build the sandbox image once (rebuild when the Dockerfile changes):

```bash
docker build -t leetcode-sandbox:latest worker/sandbox
```

Then run the worker (it needs access to the Docker daemon):

```bash
cd worker && bun install && bun run index.ts
```

### Deployment notes

- **Do not expose this worker publicly.** It only needs the Redis queue and the
  Docker daemon; keep it on a private network.
- The worker requires Docker daemon access. If you containerize the worker
  itself, mounting `/var/run/docker.sock` grants root-equivalent host access —
  prefer running the worker as an unprivileged host process, or use a rootless
  Docker / sibling-container setup.
- The sandbox targets **Linux** hosts (production). On Docker Desktop for
  Windows/macOS the same flags apply but bind-mount path handling differs.

### Tunable limits (env vars)

| Var | Default | Meaning |
| --- | --- | --- |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection for the job/result queues |
| `SANDBOX_IMAGE` | `leetcode-sandbox:latest` | sandbox image tag |
| `SANDBOX_MEMORY` | `256m` | run-time memory cap |
| `SANDBOX_COMPILE_MEMORY` | `512m` | compile-time memory cap |
| `SANDBOX_CPUS` | `1.0` | CPU cap |
| `SANDBOX_PIDS` | `128` | process/thread cap |
| `SANDBOX_TMPFS` | `32m` | writable `/tmp` size |
| `SANDBOX_FSIZE` | `33554432` | max bytes written per file (`RLIMIT_FSIZE`) |
| `SANDBOX_NOFILE` | `256` | open file-descriptor cap |
| `SANDBOX_MAX_OUTPUT_BYTES` | `1048576` | max captured stdout+stderr; past it the container is killed |
| `RUN_TIMEOUT_MS` | `5000` | execution timeout |
| `COMPILE_TIMEOUT_MS` | `10000` | compile timeout |

This project was created using `bun init` in bun v1.3.14.
