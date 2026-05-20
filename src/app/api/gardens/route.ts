import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Climate, IrrigationType } from "@prisma/client";

// مساعد: استخراج userId من Authorization header
function getUserId(request: NextRequest): string | null {
  // Flutter يُرسل: Authorization: Bearer <supabase-access-token>
  // نستخدم sub claim من JWT — أو نقرأ x-user-id header للتطوير
  const userId = request.headers.get("x-user-id");
  return userId ?? null;
}

// ─── GET /api/gardens ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gardens = await prisma.garden.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { plants: true } } },
    });

    return NextResponse.json({ data: gardens });
  } catch (error) {
    console.error("[GET /api/gardens]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/gardens ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      climate,
      irrigationType,
      timerDurationMin,
      timerTimesPerDay,
      timerTimes,
      timerIntervalDays,
    } = body as {
      name?:             string;
      climate?:          Climate;
      irrigationType?:   IrrigationType;
      timerDurationMin?: number;
      timerTimesPerDay?: number;
      timerTimes?:       string[];
      timerIntervalDays?: number;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم الحديقة مطلوب" }, { status: 400 });
    }

    const VALID_CLIMATES: Climate[] = ["HOT_ARID", "MEDITERRANEAN", "TROPICAL", "TEMPERATE"];
    if (climate && !VALID_CLIMATES.includes(climate)) {
      return NextResponse.json({ error: "نوع المناخ غير صحيح" }, { status: 400 });
    }

    const garden = await prisma.garden.create({
      data: {
        name:             name.trim(),
        climate:          climate          ?? "HOT_ARID",
        irrigationType:   irrigationType   ?? "MANUAL",
        timerDurationMin: timerDurationMin ?? null,
        timerTimesPerDay: timerTimesPerDay ?? null,
        timerTimes:       timerTimes       ?? [],
        timerIntervalDays: timerIntervalDays ?? null,
        userId,
      },
    });

    return NextResponse.json({ data: garden }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/gardens]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
