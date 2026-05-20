import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import type { PlantLocation, PotSize } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string }> };

// ─── POST /api/gardens/[gardenId]/water-all ───────────────────
// سقي جميع نباتات الحديقة دفعة واحدة (للمؤقت الذكي)
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

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const plant of garden.plants) {
        const schedule = plant.schedules[0];
        if (!schedule) continue;

        // استخدم مدة المؤقت إذا متوفرة، وإلا احسب تلقائياً
        let intervalDays: number;
        if (garden.irrigationType !== "MANUAL" && garden.timerIntervalDays) {
          intervalDays = garden.timerIntervalDays;
        } else if (schedule.isManualOverride) {
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

        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            nextDueAt,
            lastCompletedAt:      wateredAt,
            adjustedIntervalDays: intervalDays,
            lastTempUsed:         currentTemp,
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
      success:      true,
      wateredCount: updatedCount,
      wateredAt,
    });
  } catch (error) {
    console.error("[POST /water-all]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
