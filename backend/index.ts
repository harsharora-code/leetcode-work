import express from "express";
import { createClient } from "redis";
import { prisma } from "./db";
import cors from "cors";

const JOBS_QUEUE = "problems";
const COMPLETED_QUEUE = "completed_results";
const RESULTS_CHANNEL = "submission_results";

const client = createClient();
const resultConsumer = client.duplicate();

await client.connect();
await resultConsumer.connect();



const app = express();
app.use(cors());
app.use(express.json());


app.post('/submission', async (req, res) => {
    const userId = req.body.userId || "anonymous";
    const problemId = req.body.problemId;
    const code  = req.body.code;
    const language = req.body.language;
    const expectedOutput = req.body.expectedOutput;
    // "run" judges sample cases only; "submit" judges all (sample + hidden).
    const mode = req.body.mode === "run" ? "run" : "submit";
    const response = await prisma.submissions.create({
        data: {
            userId,
            problemId,
            language,
            code, 
            status: "Processing",
            expectedOutput,
            mode
        }
    })  
    
   await client.lPush(JOBS_QUEUE, JSON.stringify({submissionId: response.id, userId, problemId, code, language, mode}));
    res.json({
        message: "pending",
        id: response.id
    })
})

// await resultSubcriber.subscribe(RESULTS_CHANNEL,  async(message) => { 
//     try {
//         const {submissionId, status, output} = JSON.parse(message);
//         await prisma.submissions.update({
//             where: {id: submissionId},
//             data: {status, output}
//         });
//         console.log(`Database update for submissionId - ${submissionId}`);
//     }catch(err) {
//         console.error("submssion not update", err);
//     }
// })

async function consumeCompletedResult() {
    while(true) {
        const item = await resultConsumer.brPop(COMPLETED_QUEUE, 0);
        if(!item) continue;
        try {
            const {submissionId, status, output} = JSON.parse(item.element);

            const submission = await prisma.submissions.update({
                where: {id: submissionId},
                data: {
                    status, output
                },
            });

            await client.publish(
                RESULTS_CHANNEL, 
                JSON.stringify({
                    submissionId: submissionId,
                     userId: submission.userId,
                     problemId: submission.problemId,
                     status: submission.status,
                     output: submission.output
                     }),
            );
        } catch (error) {
            console.error("Failed to process completed_results", error);
        }
    }
}
consumeCompletedResult();

app.get("/submission/:submissionId", async(req, res) => {
    const response = await prisma.submissions.findFirst({
        where: {
            id: req.params.submissionId
        }
    })
    res.json({
        submission : response
    })
})
app.listen(3000);