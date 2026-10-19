<img width="1911" height="781" alt="image" src="https://github.com/user-attachments/assets/cb7dc09e-e4f1-4cc3-b60b-555073344987" />

## Local development with Docker Compose

Install Docker Desktop (or Docker Engine), then start the application from the
repository root:

```powershell
# PowerShell
Copy-Item .env.example .env
docker compose up --build
```

On macOS or Linux, use `cp .env.example .env` instead.

Open the frontend at http://localhost:3001. The API and WebSocket server are
available at ports `3000` and `8081`; Postgres and Redis are exposed on `5432`
and `6379` for local inspection. The backend applies the Prisma schema to the
local Compose database on startup.

The worker is included in the Compose stack. It talks to the Docker daemon to
launch a separate, tightly sandboxed container for each submission, while a
named volume shares only the temporary job files with those containers.

This is suitable for local development only: mounting `/var/run/docker.sock`
gives the worker root-equivalent control of the local Docker host. Do not use
this pattern for an internet-facing or multi-tenant production worker.

To remove local database and Redis data, run `docker compose down -v`.
