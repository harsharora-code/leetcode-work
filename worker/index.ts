import { createClient } from "redis";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "./db";

const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS ?? 5000);
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 10000);

type Status = "Success" | "Failure" | "TLE";

function runProcess(cmd: string, args: string[], timeoutMs: number) {
    return new Promise<{ code: number | null; timedOut: boolean; stdout: string; stderr: string }>((resolve) => {
        const child = spawn(cmd, args);
        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, timeoutMs);

        child.stdout?.on("data", (c) => { stdout += c.toString(); });
        child.stderr?.on("data", (c) => { stderr += c.toString(); });

        child.on("error", (err) => {
            clearTimeout(timer);
            resolve({ code: null, timedOut, stdout, stderr: stderr + String(err) });
        });

        child.on("close", (code) => {
            clearTimeout(timer);
            resolve({ code, timedOut, stdout, stderr });
        });
    });
}

async function runCode(language: string, code: string, submissionId: string): Promise<{ status: Status; output: string }> {
    const workDir = path.join(__dirname, "code", submissionId);
    await fs.mkdir(workDir, { recursive: true });

    try {
        if (language === "cpp") {
            const src = path.join(workDir, "main.cpp");
            const bin = path.join(workDir, process.platform === "win32" ? "main.exe" : "main");
            await fs.writeFile(src, code);

            const compile = await runProcess("g++", [src, "-o", bin], COMPILE_TIMEOUT_MS);
            if (compile.timedOut) return { status: "TLE", output: "Compilation timed out" };
            if (compile.code !== 0) return { status: "Failure", output: compile.stderr || "Compilation failed" };

            const run = await runProcess(bin, [], RUN_TIMEOUT_MS);
            if (run.timedOut) return { status: "TLE", output: run.stdout };
            if (run.code !== 0) return { status: "Failure", output: run.stderr || run.stdout };
            return { status: "Success", output: run.stdout };
        }

        if (language === "js") {
            const src = path.join(workDir, "main.js");
            await fs.writeFile(src, code);

            const run = await runProcess("node", [src], RUN_TIMEOUT_MS);
            if (run.timedOut) return { status: "TLE", output: run.stdout };
            if (run.code !== 0) return { status: "Failure", output: run.stderr || run.stdout };
            return { status: "Success", output: run.stdout };
        }

        return { status: "Failure", output: `Unsupported language: ${language}` };
    } finally {
        await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
}
//here we start worker to run + judge and  publish them.
const client = createClient();

client.connect().then(async () => {
    console.log(`Worker ${process.pid} started`);
    while (true) {
        const response = await client.rPop("problems");
        if (!response) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }

        try {
            const { submissionId, userId, problemId, code, language } = JSON.parse(response);
            console.log(`Worker ${process.pid} got submission ${submissionId} (${language})`);

            const result = await runCode(language, code, submissionId);
            await new Promise((r) => setTimeout(r, 3000));
            await prisma.submissions.update({
                where: {id : submissionId},
                data: {status: result.status, output: result.output}
            });
                // await new Promise((r) => setTimeout(r, 5000));
            await client.publish(
                "submission_results",
                JSON.stringify({ 
                    submissionId, 
                    userId, 
                    problemId, 
                    status: result.status, 
                    output: result.output 
                }),
            );

            console.log(`Worker ${process.pid} finished submission ${submissionId}: ${result.status}`);
        } catch (err) {
            console.error(`Worker ${process.pid} failed:`, err);
        }
    }
});
