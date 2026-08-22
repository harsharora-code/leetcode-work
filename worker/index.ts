import { createClient } from "redis";
import fs from "fs";
import path, { parse } from "path";
import { file } from "bun";
import { spawn } from "child_process";
import { exitCode } from "process";
import { prisma } from "./db";
const client  = createClient();
client.connect()
.then(async () => {
    while(1) {

    const response  = await client.rPop("problems");
    if(!response) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
    }
    try {
    const parseResponse = JSON.parse(response);
    console.log(`Worker ${process.pid} started`);
    const code = parseResponse.code;
    const language = parseResponse.language;
    const submissionId = parseResponse.problemId;

    console.log(`Worker ${process.pid} got task for user ${parseResponse.userId}`);
        let finalOutput = "";
    if(language == "cpp") {
        console.log("Worker running user c++ code");
        const filePath = path.join(__dirname, "code", "a.cpp");
        const outputPath = path.join(__dirname, "code", "out.exe");
        fs.writeFileSync(filePath, code);
        const compile = spawn("g++", [filePath, "-o", outputPath]);

        // await new Promise((r) => setTimeout(r, 2000));

        compile.stderr.on("data", (chunk) => {
        console.log("Compilation error:", chunk.toString());
    });
       compile.on("close", (exitCode) => {
        if(exitCode != 0) {
            console.log("complitaion failed");
          return;
        }
       console.log("compilation successfull");

        const response = spawn(outputPath);

        response.stdout.on("data", (chunk) => {
            console.log(chunk.toString());
            finalOutput += chunk.toString(); 
        });
        
        //upadte the status in db
        //but i want process stuck when its not completed
        response.on("exit", async() => {
          
            await prisma.submissions.update({
                where: {
                    id: submissionId,

                },
                data: {
                    status: "Success",
                    output: finalOutput
                }
            })
        })

        response.stderr.on("data", (chunk) => {
        console.log("RUNTIME ERROR:", chunk.toString());
    });
        response.on("close", (chunk) => {
            console.log(chunk)
        });
        console.log("succesfully run user c++ code");
    });
    }
    if(language == "js") {
        const filePath = __dirname + "/code/a.js";
        console.log("Running user js code");
        fs.writeFileSync(filePath, code);
        const response = spawn("node", [filePath]);
        response.stdout.on("data", (chunk) => {
            console.log(chunk.toString());
        });

        // console.log("worker running user js code");
        // await new Promise((r) =>  setTimeout(r, 3000));
        // console.log("succesfully run user js code");
    }
}
    catch (err) {
        console.error(`Worker ${process.pid} failed:`, err);
    }
}

})
