import { z } from "zod";

export const SectionValidationSchema = z.object({
    name: z.string().min(1, "Section name is required"),
    questionsCount: z.number().min(1, "Questions count must be at least 1"),
    timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
});

export const TestValidationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    timeLimit: z.number().min(1, "Total time limit is required"),
    difficulty: z.string().min(1, "Difficulty is required"),
    sections: z.array(SectionValidationSchema).min(1, "At least one section is required"),
});

export type TestInput = z.infer<typeof TestValidationSchema>;
