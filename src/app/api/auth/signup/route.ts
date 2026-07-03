import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    console.log("[SIGNUP] Received request for:", email);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    console.log("[SIGNUP] Checking if user exists...");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    console.log("[SIGNUP] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[SIGNUP] Password hashed successfully");

    console.log("[SIGNUP] Creating user...");
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    console.log("[SIGNUP] User created:", user.id);

    console.log("[SIGNUP] Signing token...");
    const token = signToken(user.id);
    console.log("[SIGNUP] Token signed");

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[SIGNUP] ERROR:", error.message);
    console.error("[SIGNUP] STACK:", error.stack);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
