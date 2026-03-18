const fs = require("fs");
const pdf = require("pdf-parse");

async function main() {
    const dataBuffer = fs.readFileSync("./question_bank/reading_question.pdf");
    const data = await pdf(dataBuffer);

    fs.writeFileSync("./reading_sample.txt", data.text.substring(0, 3000));
    console.log("Written to reading_sample.txt");
}

main().catch(console.error);
