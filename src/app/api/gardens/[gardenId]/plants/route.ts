import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWateringInterval } from "@/lib/scheduling/calculateWateringInterval";
import type { PlantLocation, PotSize, SoilType } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string }> };

// ─── GET /api/gardens/[gardenId]/plants ───────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { gardenId } = await params;

    const plants = await prisma.plant.findMany({
      where:   { gardenId },
      orderBy: { createdAt: "desc" },
      include: {
        catalog:   { select: { nameAr: true, nameEn: true, category: true } },
        schedules: { where: { isActive: true }, select: { type: true, nextDueAt: true } },
        _count:    { select: { healthLogs: true } },
      },
    });

    return NextResponse.json({ data: plants });
  } catch (error) {
    console.error("[GET /api/gardens/[gardenId]/plants]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/gardens/[gardenId]/plants ──────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { gardenId } = await params;
    const body = await request.json();

    const {
      catalogId,
      nickname,
      plantedAt,
      location,
      potSize,
      soilType,
      currentTempC = 30,
    } = body as {
      catalogId:    string;
      nickname?:    string;
      plantedAt:    string;
      location:     PlantLocation;
      potSize?:     PotSize;
      soilType?:    SoilType;
      currentTempC?: number;
    };

    if (!catalogId || !plantedAt || !location) {
      return NextResponse.json(
        { error: "catalogId, plantedAt, location — جميعها مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من وجود الحديقة
    const garden = await prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden) {
      return NextResponse.json({ error: "الحديقة غير موجودة" }, { status: 404 });
    }

    // جلب بيانات النبتة من الكتالوج لحساب دورة الري
    const catalog = await prisma.plantCatalog.findUnique({ where: { id: catalogId } });
    if (!catalog) {
      return NextResponse.json({ error: "النبتة غير موجودة في الكتالوج" }, { status: 404 });
    }

    const plantedDate = new Date(plantedAt);

    // حساب دورة الري الديناميكية (Phase 2)
    const wateringCalc = calculateWateringInterval({
      baseCycleDays:  catalog.wateringCycleSummer,
      plantedAt:      plantedDate,
      currentTempC,
      potSize:        potSize ?? null,
      location,
      season:         "summer",
    });

    // إنشاء النبتة + جدول الري في transaction واحدة
    const plant = await prisma.$transaction(async (tx) => {
      const newPlant = await tx.plant.create({
        data: {
          gardenId,
          catalogId,
          nickname:  nickname?.trim(),
          plantedAt: plantedDate,
          location,
          potSize,
          soilType:  soilType ?? "MIXED",
        },
      });

      // جدول الري الأساسي — يُنشأ تلقائياً مع كل نبتة
      await tx.schedule.create({
        data: {
          plantId:             newPlant.id,
          type:                "WATERING",
          baseIntervalDays:    catalog.wateringCycleSummer,
          adjustedIntervalDays: wateringCalc.adjustedDays,
          nextDueAt:           wateringCalc.nextDueAt,
          lastTempUsed:        currentTempC,
        },
      });

      return newPlant;
    });

    // إعادة النبتة مع الجداول والكتالوج
    const plantWithDetails = await prisma.plant.findUnique({
      where:   { id: plant.id },
      include: {
        catalog:   { select: { nameAr: true, nameEn: true, category: true } },
        schedules: { select: { type: true, nextDueAt: true, adjustedIntervalDays: true } },
      },
    });

    return NextResponse.json(
      {
        data: plantWithDetails,
        wateringSchedule: {
          nextDueAt:    wateringCalc.nextDueAt,
          intervalDays: wateringCalc.adjustedDays,
          ageCategory:  wateringCalc.ageCategory,
          modifiers:    wateringCalc.appliedModifiers,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/gardens/[gardenId]/plants]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
