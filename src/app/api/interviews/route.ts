import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRole, type = "Behavioral", experienceLevel = "Mid-Level" } = await request.json();

    if (!jobRole) {
      return NextResponse.json({ error: "Job role is required" }, { status: 400 });
    }

    // Update user's experience level
    await prisma.user.update({
      where: { id: userId },
      data: { experienceLevel },
    });

    const interview = await prisma.interview.create({
      data: {
        jobRole,
        type,
        userId,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
