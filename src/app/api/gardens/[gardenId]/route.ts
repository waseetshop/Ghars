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

// ─── DELETE /api/gardens/[gardenId] ───────────────────────────
// حذف الحديقة مع جميع نباتاتها وبياناتها (cascade يدوي)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId    = getUserId(request);
    if (!userId)    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gardenId } = await params;

    const garden = await prisma.garden.findFirst({ where: { id: gardenId, userId } });
    if (!garden)  return NextResponse.json({ error: "الحديقة غير موجودة" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // ─ جميع نباتات الحديقة
      const plants = await tx.plant.findMany({ where: { gardenId }, select: { id: true } });
      const plantIds = plants.map((p) => p.id);

      if (plantIds.length > 0) {
        // جداول الري
        const schedules = await tx.schedule.findMany({
          where: { plantId: { in: plantIds } },
          select: { id: true },
        });
        const scheduleIds = schedules.map((s) => s.id);

        if (scheduleIds.length > 0) {
          await tx.schedulePause.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
          await tx.fertilizerAssignment.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
          await tx.scheduleEntry.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
          await tx.notification.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
          await tx.weatherScheduleOverride.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
        }
        await tx.schedule.deleteMany({ where: { plantId: { in: plantIds } } });

        // جلسات التشخيص
        const sessions = await tx.diagnosisSession.findMany({
          where: { plantId: { in: plantIds } },
          select: { id: true },
        });
        const sessionIds = sessions.map((s) => s.id);

        if (sessionIds.length > 0) {
          await tx.diagnosisConfirmation.deleteMany({ where: { sessionId: { in: sessionIds } } });
          await tx.aIAnalysisResult.deleteMany({ where: { sessionId: { in: sessionIds } } });
          await tx.diagnosisImage.deleteMany({ where: { sessionId: { in: sessionIds } } });
        }

        // سجلات الصحة
        await tx.healthLog.updateMany({ where: { plantId: { in: plantIds } }, data: { diagnosisSessionId: null } });
        await tx.healthLog.deleteMany({ where: { plantId: { in: plantIds } } });
        await tx.diagnosisSession.deleteMany({ where: { plantId: { in: plantIds } } });

        // صور النباتات
        await tx.plantPhoto.deleteMany({ where: { plantId: { in: plantIds } } });

        // النباتات
        await tx.plant.deleteMany({ where: { gardenId } });
      }

      // إعدادات الطقس
      await tx.gardenWeatherConfig.deleteMany({ where: { gardenId } });

      // الحديقة نفسها
      await tx.garden.delete({ where: { id: gardenId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/gardens/[gardenId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
