import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import type { PlantLocation, PotSize } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

// ─── PATCH /api/gardens/[gardenId]/plants/[plantId]/schedule ──
// ضبط دورة السقي يدوياً أو إعادتها للحساب التلقائي
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;
    const body = await request.json() as {
      intervalDays?: number;  // إذا مُرسل → manual override
      reset?:        boolean; // إذا true → أعد للحساب التلقائي
      currentTempC?: number;
    };

    const plant = await prisma.plant.findUnique({
      where:   { id: plantId, gardenId },
      include: {
        catalog:   { select: { wateringCycleSummer: true } },
        schedules: { where: { isActive: true, type: "WATERING" } },
      },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    const schedule = plant.schedules[0];
    if (!schedule) {
      return NextResponse.json({ error: "لا يوجد جدول سقي نشط" }, { status: 404 });
    }

    let intervalDays: number;
    let isManualOverride: boolean;

    if (body.reset) {
      // إعادة الحساب التلقائي
      const currentTemp = body.currentTempC ?? schedule.lastTempUsed ?? 30;
      const calc = calculateWateringInterval({
        baseCycleDays: plant.catalog.wateringCycleSummer,
        plantedAt:     plant.plantedAt,
        currentTempC:  currentTemp,
        potSize:       plant.potSize as PotSize | null,
        location:      plant.location as PlantLocation,
        season:        "summer",
      });
      intervalDays     = calc.adjustedDays;
      isManualOverride = false;
    } else if (body.intervalDays && body.intervalDays >= 1) {
      intervalDays     = Math.round(body.intervalDays);
      isManualOverride = true;
    } else {
      return NextResponse.json(
        { error: "يجب تحديد intervalDays أو reset: true" },
        { status: 400 },
      );
    }

    // احسب الموعد التالي من آخر ري (أو من الآن إذا لم يُسقَ بعد)
    const baseDate  = schedule.lastCompletedAt ?? new Date();
    const nextDueAt = new Date(baseDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        adjustedIntervalDays: intervalDays,
        isManualOverride,
        nextDueAt,
      },
    });

    return NextResponse.json({
      success:         true,
      intervalDays,
      isManualOverride,
      nextDueAt:       updated.nextDueAt,
    });
  } catch (error) {
    console.error("[PATCH /schedule]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
