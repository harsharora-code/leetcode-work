# Sandbox image for running untrusted user submissions.
#
# Contains only what the judge needs: a JS runtime (node) and a C++ toolchain
# (g++). Runs as a non-root user by default; the worker additionally passes
# --user 1001:1001, --cap-drop ALL, --network none, --read-only and resource
# limits at `docker run` time. See ../sandbox.ts.

FROM node:20-bookworm-slim

# C++ toolchain. bookworm-slim ships glibc + libstdc++; add the compiler.
RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root runtime user (matches the --user flag the worker passes).
RUN useradd --create-home --uid 1001 runner

USER 1001:1001
WORKDIR /work

# No CMD/ENTRYPOINT: the worker supplies the exact command per submission
# (e.g. `g++ ... -o /work/main`, `/work/main`, or `node /work/main.js`).
