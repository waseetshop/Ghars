import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

const severityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
  HEALTHY:    "LOW",
  STRESSED:   "MEDIUM",
  DISEASED:   "HIGH",
  RECOVERING: "LOW",
  CRITICAL:   "CRITICAL",
};

const labelMap: Record<string, string> = {
  HEALTHY:    "بصحة جيدة",
  STRESSED:   "متوتر",
  DISEASED:   "مريض",
  RECOVERING: "في التعافي",
  CRITICAL:   "حرج",
};

// ─── POST /api/gardens/[gardenId]/plants/[plantId]/health-log ──
// تسجيل حالة صحية يدوية + تحديث healthStatus للنبتة
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;
    const body = await request.json() as {
      healthStatus: string;
      notes?:       string;
    };

    if (!body.healthStatus) {
      return NextResponse.json(
        { error: "healthStatus مطلوب" },
        { status: 400 },
      );
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId, gardenId },
    });
    if (!plant) {
      return NextResponse.json(
        { error: "النبتة غير موجودة" },
        { status: 404 },
      );
    }

    const severity  = severityMap[body.healthStatus] ?? "LOW";
    const diagnosis = body.notes?.trim() ||
                      labelMap[body.healthStatus] ||
                      "سجل يدوي";

    // تحديث الحالة + إنشاء سجل صحي في transaction واحدة
    const [log] = await prisma.$transaction([
      prisma.healthLog.create({
        data: {
          plantId,
          diagnosis,
          severity,
          diagnosisSessionId: null,
        },
      }),
      prisma.plant.update({
        where: { id: plantId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { healthStatus: body.healthStatus as any },
      }),
    ]);

    return NextResponse.json(
      { success: true, log: { id: log.id, createdAt: log.createdAt } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /health-log]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
