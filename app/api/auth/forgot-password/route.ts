import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { generateNumericCode, hashToken, isValidEmail, normalizeEmail } from "@/lib/security";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1),
});

const GENERIC_RESPONSE = {
  message: "If the account exists, a reset code has been sent.",
};

export async function POST(req: Request) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const email = normalizeEmail(parsed.data.email);
    const ip = getClientIp(req);
    const limitKey = `forgot-password:${ip}:${email}`;
    const rateLimit = checkRateLimit(limitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json({ message: "Too many reset requests. Please try again later." }, { status: 429 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const resetCode = generateNumericCode(6);
    user.resetPasswordToken = hashToken(resetCode);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password reset code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Password reset request</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p style="color: #ef4444; font-size: 14px;">This code expires in 15 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ message: "Server error while handling reset request" }, { status: 500 });
  }
}
