import fs from "fs";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Test from "./lib/models/Test";
import Question, { IQuestion } from "./lib/models/Question";

// Load environment variables manually since this is a standalone script
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env.local");
}

function parseText(text: string, sectionName: string): Partial<IQuestion>[] {
    text = text.replace(/\r/g, "");
    const questions: Partial<IQuestion>[] = [];

    // Split text by "Question ID " which marks the start of each new question
    const blocks = text.split(/Question ID [a-f0-9]+\n/i).filter(b => b.trim().length > 0);

    for (const block of blocks) {
        try {
            // First let's extract the ID line if it's there
            let content = block;
            const idMatch = content.match(/^ID:\s*([a-f0-9]+)\n/i);
            let id = "";
            if (idMatch) {
                id = idMatch[1];
                content = content.replace(idMatch[0], "");
            }

            // Look for Answer block
            const answerSplit = content.split(/ID:\s*[a-f0-9]+\s*Answer\n/i);
            if (answerSplit.length < 2) continue; // Malformed

            let questionPart = answerSplit[0].trim();
            const answerPart = answerSplit[1].trim();

            // Extract the question, passage, and choices
            const choiceRegex = /\n([A-D])\.\s/g;
            let choiceMatches = [...questionPart.matchAll(choiceRegex)];

            let passage = "";
            let questionText = "";
            let choices: string[] = [];

            if (choiceMatches.length > 0) {
                // There are explicit choices (A, B, C, D)
                const textBeforeChoices = questionPart.substring(0, choiceMatches[0].index).trim();

                // For Reading, usually there's a passage and a question.
                // We'll try to split them if there's a distinct question at the end (ends with ? or _)
                const lines = textBeforeChoices.split("\n");
                let qIndex = lines.length - 1;
                while (qIndex > 0) {
                    if (lines[qIndex].includes("?") || lines[qIndex].includes("______") || lines[qIndex].toLowerCase().includes("which choice") || lines[qIndex].toLowerCase().includes("based on the text")) {
                        break;
                    }
                    qIndex--;
                }

                if (qIndex > 0 && sectionName !== "Math") {
                    passage = lines.slice(0, qIndex).join("\n").trim();
                    questionText = lines.slice(qIndex).join("\n").trim();
                } else if (qIndex > 0 && sectionName === "Math" && lines.length > 3) {
                    // specific case for Math questions with long prefix text like table data
                    passage = lines.slice(0, qIndex).join("\n").trim();
                    questionText = lines.slice(qIndex).join("\n").trim();
                } else {
                    questionText = textBeforeChoices;
                }

                // Extract choices
                for (let i = 0; i < choiceMatches.length; i++) {
                    const letter = choiceMatches[i][1];
                    const startIdx = choiceMatches[i].index! + choiceMatches[i][0].length;
                    const endIdx = i < choiceMatches.length - 1 ? choiceMatches[i + 1].index : questionPart.length;
                    const choiceText = questionPart.substring(startIdx, endIdx).trim();
                    choices.push(choiceText || "[Image/Equation missing from PDF]");
                }
            } else {
                // Grid-in question (no choices)
                questionText = questionPart;
            }

            // Extract Correct Answer
            const correctAnswerMatch = answerPart.match(/Correct Answer:\n(.+(?:\n.+)*?)\nRationale\n/);
            let correctAnswer = "";
            let rationalePart = answerPart;
            if (correctAnswerMatch) {
                correctAnswer = correctAnswerMatch[1].trim();
                rationalePart = answerPart.substring(answerPart.indexOf("Rationale\n") + 10);
            } else if (answerPart.includes("Rationale\n")) {
                const parts = answerPart.split("Rationale\n");
                const potentialAnswer = parts[0].replace(/Correct Answer:\n?/, "").trim();
                if (potentialAnswer) correctAnswer = potentialAnswer;
                rationalePart = parts[1];
            }

            // Extract Rationale
            const rationaleEndSplit = rationalePart.split(/\nQuestion Difficulty:\n|\nAssessment\n/);
            let explanation = rationaleEndSplit[0].trim();
            if (explanation.includes("Assessment\nSAT")) {
                explanation = explanation.split("Assessment\nSAT")[0].trim();
            }

            // Extract Difficulty
            const difficultyMatch = rationalePart.match(/Question Difficulty:\n(Easy|Medium|Hard)/i);
            let difficulty = "medium";
            if (difficultyMatch) {
                difficulty = difficultyMatch[1].toLowerCase();
            }

            // Check required fields
            if (!questionText) {
                console.warn(`Skipping question ${idMatch?.[1]} due to missing text`);
                continue;
            }
            if (!correctAnswer) {
                console.warn(`Skipping question ${idMatch?.[1]} due to missing correct answer`);
                continue;
            }
            if (!explanation) explanation = "No explanation provided.";

            let q: Partial<IQuestion> = {
                section: sectionName,
                questionText,
                passage,
                choices, // could be empty array for grid-ins
                correctAnswer,
                explanation,
                difficulty: difficulty as any,
                points: difficulty === "easy" ? 10 : (difficulty === "medium" ? 20 : 30) // give some points logic
            };

            questions.push(q);
        } catch (e) {
            console.warn("Failed to parse block", e);
        }
    }

    return questions;
}

async function main() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        const readingText = fs.readFileSync("reading_sample.txt", "utf-8");
        const mathText = fs.readFileSync("math_sample.txt", "utf-8");

        console.log("Parsing Reading questions...");
        const readingQuestions = parseText(readingText, "Reading and Writing");
        console.log(`Parsed ${readingQuestions.length} Reading questions`);

        console.log("Parsing Math questions...");
        const mathQuestions = parseText(mathText, "Math");
        console.log(`Parsed ${mathQuestions.length} Math questions`);

        const allQuestions = [...readingQuestions, ...mathQuestions];

        // Shuffle questions
        const shuffledQuestions = [...allQuestions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        const testChunks: Partial<IQuestion>[][] = [];
        let currentChunk: Partial<IQuestion>[] = [];

        for (let i = 0; i < shuffledQuestions.length; i++) {
            currentChunk.push(shuffledQuestions[i]);
            if (currentChunk.length === 20) {
                testChunks.push(currentChunk);
                currentChunk = [];
            }
        }

        if (currentChunk.length > 0) {
            // Pad the last chunk to have 20 questions
            while (currentChunk.length < 20) {
                currentChunk.push(allQuestions[Math.floor(Math.random() * allQuestions.length)]);
            }
            testChunks.push(currentChunk);
        }

        // Clear existing data (optional, to avoid accumulating huge amounts)
        await Test.deleteMany({});
        await Question.deleteMany({});
        console.log("Cleared existing tests and questions");

        let testCount = 1;
        for (const chunk of testChunks) {
            const readingCount = chunk.filter(q => q.section === "Reading and Writing").length;
            const mathCount = chunk.filter(q => q.section === "Math").length;

            const newTest = await Test.create({
                title: `Imported SAT Practice Test ${testCount++}`,
                timeLimit: 134,
                difficulty: "medium",
                sections: [
                    { name: "Reading and Writing", questionsCount: readingCount, timeLimit: 64 },
                    { name: "Math", questionsCount: mathCount, timeLimit: 70 },
                ],
            });
            console.log(`Created new Test: ${newTest._id} (${readingCount} Reading, ${mathCount} Math)`);

            const questionsToInsert = chunk.map(q => {
                const copy = { ...q, testId: newTest._id };
                if (!copy.passage) delete copy.passage;
                return copy;
            });

            const inserted = await Question.insertMany(questionsToInsert);
            console.log(`Inserted ${inserted.length} questions for Test ${newTest._id}`);

            newTest.questions = inserted.map(q => q._id as any);
            await newTest.save();
        }

        console.log("Test updated with question IDs. Seeding complete!");
        process.exit(0);

    } catch (e) {
        console.error("Error running script:", e);
        process.exit(1);
    }
}

main();
