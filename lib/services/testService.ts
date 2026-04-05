import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import { TestValidationSchema, type TestInput } from "@/lib/schema/test";

type SortableTestField = "createdAt" | "title";

export const testService = {
  async getTests(page: number, limit: number, sortBy: string, sortOrder: string) {
    await dbConnect();

    const skip = (page - 1) * limit;
    const normalizedSortBy: SortableTestField = sortBy === "title" ? "title" : "createdAt";
    const normalizedSortOrder = sortOrder === "asc" ? 1 : -1;
    const sortObj: Record<SortableTestField, 1 | -1> = {
      createdAt: normalizedSortBy === "createdAt" ? normalizedSortOrder : -1,
      title: normalizedSortBy === "title" ? normalizedSortOrder : 1,
    };

    const totalTests = await Test.countDocuments({});
    const tests = await Test.find({}).sort(sortObj).skip(skip).limit(limit).lean();

    const testIds = tests.map((test) => test._id);
    const questionCountsData = await Question.aggregate([
      { $match: { testId: { $in: testIds } } },
      {
        $group: {
          _id: { testId: "$testId", section: "$section", module: "$module" },
          count: { $sum: 1 },
        },
      },
    ]);

    const testsWithCounts = tests.map((test) => {
      const counts = { rw_1: 0, rw_2: 0, math_1: 0, math_2: 0 };

      questionCountsData.forEach((questionCount) => {
        if (questionCount._id.testId.toString() === test._id.toString()) {
          const sectionPrefix = questionCount._id.section === "Reading and Writing" ? "rw" : "math";
          const key = `${sectionPrefix}_${questionCount._id.module}` as keyof typeof counts;
          counts[key] = questionCount.count;
        }
      });

      return { ...test, questionCounts: counts };
    });

    return {
      tests: testsWithCounts,
      pagination: {
        total: totalTests,
        page,
        limit,
        totalPages: Math.ceil(totalTests / limit),
      },
    };
  },

  async createTest(data: unknown) {
    try {
      const validatedData: TestInput = TestValidationSchema.parse(data);
      await dbConnect();
      const newTest = await Test.create(validatedData);
      return newTest;
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
