import { z } from "zod";

export const AnswerValidationSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
});

export const ResultValidationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    testId: z.string().min(1, "Test ID is required"),
    answers: z.array(AnswerValidationSchema),
    score: z.number().min(0, "Score cannot be negative"),
    sectionBreakdown: z.object({
        readingAndWriting: z.number().min(0),
        math: z.number().min(0),
    }),
});

export type ResultInput = z.infer<typeof ResultValidationSchema>;
