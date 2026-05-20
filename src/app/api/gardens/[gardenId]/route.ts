import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Climate, IrrigationType } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string }> };

function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id") ?? null;
}

// ─── PATCH /api/gardens/[gardenId] ────────────────────────────
// تحديث بيانات الحديقة (الاسم، المناخ، نظام السقي)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId   = getUserId(request);
    if (!userId)   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gardenId } = await params;
    const body = await request.json() as {
      name?:             string;
      climate?:          Climate;
      irrigationType?:   IrrigationType;
      timerDurationMin?: number | null;
      timerTimesPerDay?: number | null;
      timerTimes?:       string[];
      timerIntervalDays?: number | null;
    };

    const garden = await prisma.garden.findFirst({
      where: { id: gardenId, userId },
    });
    if (!garden) return NextResponse.json({ error: "الحديقة غير موجودة" }, { status: 404 });

    const updated = await prisma.garden.update({
      where: { id: gardenId },
      data: {
        ...(body.name             !== undefined && { name:             body.name.trim() }),
        ...(body.climate          !== undefined && { climate:          body.climate }),
        ...(body.irrigationType   !== undefined && { irrigationType:   body.irrigationType }),
        ...(body.timerDurationMin !== undefined && { timerDurationMin: body.timerDurationMin }),
        ...(body.timerTimesPerDay !== undefined && { timerTimesPerDay: body.timerTimesPerDay }),
        ...(body.timerTimes       !== undefined && { timerTimes:       body.timerTimes }),
        ...(body.timerIntervalDays !== undefined && { timerIntervalDays: body.timerIntervalDays }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/gardens/[gardenId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
