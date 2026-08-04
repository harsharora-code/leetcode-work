import express from "express";
import { createClient } from "redis";
const client = createClient();

client.connect();


const app = express();
app.use(express.json());
app.post('/submission', (req, res) => {
    const userId = req.body.userId;
    const problemId = req.body.problemId;
    const code  = req.body.code;
    const language = req.body.language;
    
    client.lPush("problems", JSON.stringify({userId, problemId, code, language}));
    res.json({
        message: "pending"
    })
})
app.listen(3000);