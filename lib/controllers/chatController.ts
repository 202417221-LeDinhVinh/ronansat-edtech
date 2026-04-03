import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { chatService } from "@/lib/services/chatService";

const chatMessageSchema = z.object({
  questionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export const chatController = {
  async getChat(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const questionId = searchParams.get("questionId");

      if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
        return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
      }

      const messages = await chatService.getChatHistory(session.user.id, questionId);
      return NextResponse.json({ messages });
    } catch (error) {
      console.error("GET /api/chat error:", error);
      return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
  },

  async postMessage(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const rateLimit = checkRateLimit(`chat:${session.user.id}:${getClientIp(req)}`, {
        limit: 30,
        windowMs: 10 * 60 * 1000,
      });

      if (!rateLimit.success) {
        return NextResponse.json({ error: "Too many chat requests" }, { status: 429 });
      }

      const parsed = chatMessageSchema.safeParse(await req.json());
      if (!parsed.success || !mongoose.Types.ObjectId.isValid(parsed.data.questionId)) {
        return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
      }

      const result = await chatService.processMessage(
        session.user.id,
        parsed.data.questionId,
        parsed.data.message
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error("POST /api/chat error:", error);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Chat request failed" }, { status: 500 });
    }
  },
};
