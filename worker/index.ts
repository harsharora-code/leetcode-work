import { createClient } from "redis";
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

    console.log(`Worker ${process.pid} got task for user ${parseResponse.userId}`);

    if(language == "c++") {
        console.log("Worker running user c++ code");
        await new Promise((r) => setTimeout(r, 5000));
        console.log("succesfully run user c++ code");
    }
    if(language == "js") {
        console.log("worker running user js code");
        await new Promise((r) =>  setTimeout(r, 3000));
        console.log("succesfully run user js code");
    }
}
    catch (err) {
        console.error(`Worker ${process.pid} failed:`, err);
    }
}

})
