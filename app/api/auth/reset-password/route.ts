import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { hashToken, isValidEmail, normalizeEmail, validatePasswordStrength } from "@/lib/security";

const resetPasswordSchema = z.object({
  email: z.string().trim().min(1),
  code: z.string().trim().regex(/^\d{6}$/),
  newPassword: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = resetPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid reset payload" }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);
    const { code, newPassword } = parsed.data;
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`reset-password:${ip}:${email}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json({ message: "Too many reset attempts. Please try again later." }, { status: 429 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Invalid reset code or expired code" }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      email,
      resetPasswordToken: hashToken(code),
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return NextResponse.json({ message: "Invalid reset code or expired code" }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ message: "System error" }, { status: 500 });
  }
}
