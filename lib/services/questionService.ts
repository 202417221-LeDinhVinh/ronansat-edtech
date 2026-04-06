import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import redis from "@/lib/redis";
import { QuestionValidationSchema } from "@/lib/schema/question";

const QUESTION_BY_TEST_TTL_SECONDS = 60;

function getQuestionListCacheKey(testId: string) {
  return `questions:test:${testId}`;
}

async function deleteCacheKeys(keys: Array<string | null | undefined>) {
  const uniqueKeys = [...new Set(keys.filter((key): key is string => Boolean(key)))];

  if (uniqueKeys.length > 0) {
    await redis.del(...uniqueKeys);
  }
}

export const questionService = {
  async getQuestions(testId?: string | null) {
    if (!testId) {
      await dbConnect();
      return Question.find({}).lean();
    }

    const cacheKey = getQuestionListCacheKey(testId);
    const cachedQuestions = await redis.get(cacheKey);

    if (cachedQuestions) {
      const ttl = await redis.ttl(cacheKey);

      if (ttl > 0) {
        return JSON.parse(cachedQuestions);
      }

      await redis.del(cacheKey);
    }

    await dbConnect();

    const questions = await Question.find({ testId }).lean();

    await redis.set(cacheKey, JSON.stringify(questions), "EX", QUESTION_BY_TEST_TTL_SECONDS);

    return questions;
  },

  async createQuestion(data: unknown) {
    try {
      const validatedData = QuestionValidationSchema.parse(data);
      await dbConnect();

      const test = await Test.findById(validatedData.testId);
      if (!test) {
        throw new Error("Test not found");
      }

      const newQuestion = await Question.create(validatedData);

      if (!test.questions) {
        test.questions = [];
      }

      test.questions.push(newQuestion._id as (typeof test.questions)[number]);
      await test.save();

      await deleteCacheKeys([getQuestionListCacheKey(validatedData.testId)]);

      return newQuestion;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const validationError = new Error("Validation Error") as Error & {
          errors: z.ZodIssue[];
          name: string;
        };
        validationError.errors = error.issues;
        validationError.name = "ZodError";
        throw validationError;
      }

      throw error;
    }
  },
};
