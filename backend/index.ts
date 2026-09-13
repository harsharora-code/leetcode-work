import express from "express";
import { createClient } from "redis";
import { prisma } from "./db";
import { captureRejectionSymbol } from "node:events";
const client = createClient();
const resultSubcriber = createClient();
await client.connect();
await resultSubcriber.connect();

const RESULTS_CHANNEL = "submission_results";

const app = express();
app.use(express.json());
app.post('/submission', async (req, res) => {
    const userId = req.body.userId || "anonymous";
    const problemId = req.body.problemId;
    const code  = req.body.code;
    const language = req.body.language;

    const response = await prisma.submissions.create({
        data: {
            userId,
            problemId,
            language,
            code, 
            status: "Processing"
        }
    })  
    
   await client.lPush("problems", JSON.stringify({submissionId: response.id, userId, problemId, code, language}));
    res.json({
        message: "pending",
        id: response.id
    })
})

await resultSubcriber.subscribe(RESULTS_CHANNEL,  async(message) => { 
    try {
        const {submissionId, status, output} = JSON.parse(message);
        await prisma.submissions.update({
            where: {id: submissionId},
            data: {status, output}
        });
        console.log(`Database update for submissionId - ${submissionId}`);
    }catch(err) {
        console.error("submssion not update", err);
    }
})

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