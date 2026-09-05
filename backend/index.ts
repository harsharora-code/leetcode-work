import express from "express";
import { createClient } from "redis";
import { prisma } from "./db";
const client = createClient();

client.connect();

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
    
    client.lPush("problems", JSON.stringify({submissionId: response.id, userId, problemId, code, language}));
    res.json({
        message: "pending",
        id: response.id
    })
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