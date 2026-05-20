import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import { getNextSmartTimerSlot } from "@/lib/scheduling/timerSlot";
import type { PlantLocation, PotSize } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string }> };

// ─── POST /api/gardens/[gardenId]/water-all ───────────────────
// سقي جميع نباتات الحديقة دفعة واحدة
// • SMART_TIMER → nextDueAt موحّد = الـ slot التالي في جدول الجهاز
// • TIMER       → كل نبتة تحتفظ بجدولها (timerIntervalDays إذا ضُبط)
// • MANUAL      → حساب فردي لكل نبتة
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { gardenId } = await params;
    const body = await request.json().catch(() => ({})) as {
      currentTempC?: number;
      wateredAt?:    string;
    };

    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        plants: {
          include: {
            catalog:   { select: { wateringCycleSummer: true } },
            schedules: { where: { isActive: true, type: "WATERING" } },
          },
        },
      },
    });

    if (!garden) {
      return NextResponse.json({ error: "الحديقة غير موجودة" }, { status: 404 });
    }

    const wateredAt   = body.wateredAt ? new Date(body.wateredAt) : new Date();
    const currentTemp = body.currentTempC ?? 30;
    const isSmartTimer = garden.irrigationType === "SMART_TIMER";

    // حساب الـ nextDueAt موحّد مسبقاً للمؤقت الذكي
    let unifiedNextDueAt: Date | null = null;
    if (isSmartTimer) {
      unifiedNextDueAt = getNextSmartTimerSlot(
        garden.timerTimes,
        garden.timerIntervalDays ?? 1,
        wateredAt,
      );
    }

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const plant of garden.plants) {
        const schedule = plant.schedules[0];
        if (!schedule) continue;

        let nextDueAt: Date;

        if (isSmartTimer && unifiedNextDueAt) {
          // ── المؤقت الذكي: كل النباتات على نفس الـ slot ──────
          nextDueAt = unifiedNextDueAt;
        } else if (garden.irrigationType === "TIMER" && garden.timerIntervalDays) {
          // ── مؤقت زراعي: فترة ثابتة من الجهاز ───────────────
          nextDueAt = new Date(
            wateredAt.getTime() + garden.timerIntervalDays * 24 * 60 * 60 * 1000,
          );
        } else if (schedule.isManualOverride) {
          // ── ضبط يدوي للنبتة ─────────────────────────────────
          nextDueAt = new Date(
            wateredAt.getTime() + schedule.adjustedIntervalDays * 24 * 60 * 60 * 1000,
          );
        } else {
          // ── حساب تلقائي فردي (MANUAL) ────────────────────────
          const calc = calculateWateringInterval({
            baseCycleDays: plant.catalog.wateringCycleSummer,
            plantedAt:     plant.plantedAt,
            currentTempC:  currentTemp,
            potSize:       plant.potSize as PotSize | null,
            location:      plant.location as PlantLocation,
            season:        "summer",
          });
          nextDueAt = calc.nextDueAt;
        }

        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            nextDueAt,
            lastCompletedAt:      wateredAt,
            adjustedIntervalDays: isSmartTimer
              ? (garden.timerIntervalDays ?? 1)
              : schedule.adjustedIntervalDays,
            lastTempUsed: currentTemp,
          },
        });

        await tx.plant.update({
          where: { id: plant.id },
          data:  { lastInspection: wateredAt },
        });

        updatedCount++;
      }
    });

    return NextResponse.json({
      success:        true,
      wateredCount:   updatedCount,
      wateredAt,
      nextDueAt:      unifiedNextDueAt, // يُرجع الـ slot للـ UI
    });
  } catch (error) {
    console.error("[POST /water-all]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
