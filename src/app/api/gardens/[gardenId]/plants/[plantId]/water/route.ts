import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import type { PlantLocation, PotSize } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

// ─── POST /api/gardens/[gardenId]/plants/[plantId]/water ──────
// تسجيل دورة ري مكتملة + حساب الموعد التالي
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;
    const body = await request.json().catch(() => ({})) as {
      currentTempC?: number;
      wateredAt?:   string;
    };

    const plant = await prisma.plant.findUnique({
      where:   { id: plantId, gardenId },
      include: {
        catalog:   { select: { wateringCycleSummer: true } },
        schedules: {
          where:  { isActive: true, type: "WATERING" },
          select: {
            id: true, adjustedIntervalDays: true, lastTempUsed: true,
            lastCompletedAt: true, isManualOverride: true,
          },
        },
      },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    const schedule = plant.schedules[0];
    if (!schedule) {
      return NextResponse.json({ error: "لا يوجد جدول ري للنبتة" }, { status: 404 });
    }

    const wateredAt   = body.wateredAt ? new Date(body.wateredAt) : new Date();
    const currentTemp = body.currentTempC ?? schedule.lastTempUsed ?? 30;

    // إذا كان الضبط يدوياً → استخدم الفترة المحفوظة مباشرة
    let intervalDays: number;
    if (schedule.isManualOverride) {
      intervalDays = schedule.adjustedIntervalDays;
    } else {
      const calc = calculateWateringInterval({
        baseCycleDays: plant.catalog.wateringCycleSummer,
        plantedAt:     plant.plantedAt,
        currentTempC:  currentTemp,
        potSize:       plant.potSize as PotSize | null,
        location:      plant.location as PlantLocation,
        season:        "summer",
      });
      intervalDays = calc.adjustedDays;
    }

    const nextDueAt = new Date(
      wateredAt.getTime() + intervalDays * 24 * 60 * 60 * 1000,
    );

    // تحديث جدول الري
    const updatedSchedule = await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        nextDueAt,
        lastCompletedAt:      wateredAt,
        adjustedIntervalDays: intervalDays,
        lastTempUsed:         schedule.isManualOverride
          ? schedule.lastTempUsed
          : currentTemp,
      },
    });

    // تحديث آخر فحص للنبتة
    await prisma.plant.update({
      where: { id: plantId },
      data:  { lastInspection: wateredAt },
    });

    return NextResponse.json({
      success:         true,
      wateredAt,
      nextDueAt,
      intervalDays,
      isManualOverride: schedule.isManualOverride,
      scheduleId:       updatedSchedule.id,
    });
  } catch (error) {
    console.error("[POST /water]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
