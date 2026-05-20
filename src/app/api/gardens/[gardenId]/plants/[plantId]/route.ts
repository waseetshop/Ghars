import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import type { PlantLocation, PotSize, SoilType, ScheduleType } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

// ─── GET /api/gardens/[gardenId]/plants/[plantId] ─────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;

    const plant = await prisma.plant.findUnique({
      where:   { id: plantId, gardenId },
      include: {
        catalog:   true,
        schedules: {
          where:   { isActive: true },
          include: { fertilizerAssignment: { include: { fertilizer: true } } },
          orderBy: { nextDueAt: "asc" },
        },
        healthLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ data: plant });
  } catch (error) {
    console.error("[GET /plants/[plantId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/gardens/[gardenId]/plants/[plantId] ───────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;
    const body = await request.json() as {
      nickname?:    string | null;
      location?:    PlantLocation;
      potSize?:     PotSize | null;
      soilType?:    SoilType;
      notes?:       string | null;
      currentTempC?: number;
    };

    const plant = await prisma.plant.findUnique({
      where:   { id: plantId, gardenId },
      include: { catalog: true, schedules: { where: { isActive: true, type: "WATERING" } } },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    const locationChanged = body.location !== undefined && body.location !== plant.location;
    const potSizeChanged  = body.potSize  !== undefined && body.potSize  !== plant.potSize;
    const shouldRecalcWatering = (locationChanged || potSizeChanged) && plant.schedules.length > 0;

    const updatedPlant = await prisma.$transaction(async (tx) => {
      const result = await tx.plant.update({
        where: { id: plantId },
        data:  {
          ...(body.nickname  !== undefined && { nickname:  body.nickname  }),
          ...(body.location  !== undefined && { location:  body.location  }),
          ...(body.potSize   !== undefined && { potSize:   body.potSize   }),
          ...(body.soilType  !== undefined && { soilType:  body.soilType  }),
          ...(body.notes     !== undefined && { notes:     body.notes     }),
        },
        include: {
          catalog:   { select: { nameAr: true, nameEn: true } },
          schedules: { where: { isActive: true } },
        },
      });

      // إعادة حساب دورة الري إذا تغيّر الموقع أو حجم الأصيص
      if (shouldRecalcWatering) {
        const wateringSchedule = plant.schedules[0];
        const newCalc = calculateWateringInterval({
          baseCycleDays:  plant.catalog.wateringCycleSummer,
          plantedAt:      plant.plantedAt,
          currentTempC:   body.currentTempC ?? wateringSchedule.lastTempUsed ?? 30,
          potSize:        (body.potSize ?? plant.potSize) as PotSize | null,
          location:       (body.location ?? plant.location) as PlantLocation,
          season:         "summer",
        });

        await tx.schedule.update({
          where: { id: wateringSchedule.id },
          data:  {
            adjustedIntervalDays: newCalc.adjustedDays,
            nextDueAt:            newCalc.nextDueAt,
            lastTempUsed:         body.currentTempC ?? wateringSchedule.lastTempUsed,
          },
        });
      }

      return result;
    });

    return NextResponse.json({
      data:              updatedPlant,
      wateringRecalculated: shouldRecalcWatering,
    });
  } catch (error) {
    console.error("[PATCH /plants/[plantId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/gardens/[gardenId]/plants/[plantId] ──────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;

    const plant = await prisma.plant.findUnique({ where: { id: plantId, gardenId } });
    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    // Manual cascade — schema has no onDelete: Cascade
    await prisma.$transaction(async (tx) => {
      // IDs of related schedules & sessions
      const schedules = await tx.schedule.findMany({ where: { plantId }, select: { id: true } });
      const scheduleIds = schedules.map((s) => s.id);

      const sessions = await tx.diagnosisSession.findMany({ where: { plantId }, select: { id: true } });
      const sessionIds = sessions.map((s) => s.id);

      // Schedule children
      if (scheduleIds.length > 0) {
        await tx.schedulePause.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
        await tx.fertilizerAssignment.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
        await tx.scheduleEntry.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
        await tx.notification.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
        await tx.weatherScheduleOverride.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
      }
      await tx.schedule.deleteMany({ where: { plantId } });

      // DiagnosisSession children
      if (sessionIds.length > 0) {
        await tx.diagnosisConfirmation.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.aIAnalysisResult.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.diagnosisImage.deleteMany({ where: { sessionId: { in: sessionIds } } });
      }

      // HealthLogs (may reference sessions — clear FK first)
      await tx.healthLog.updateMany({ where: { plantId }, data: { diagnosisSessionId: null } });
      await tx.healthLog.deleteMany({ where: { plantId } });

      // DiagnosisSessions (after healthLogs released the FK)
      await tx.diagnosisSession.deleteMany({ where: { plantId } });

      // Photos
      await tx.plantPhoto.deleteMany({ where: { plantId } });

      // Plant
      await tx.plant.delete({ where: { id: plantId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /plants/[plantId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
