import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeWithVision, routeByConfidence } from "@/lib/ai/diagnosisEngine";
import { evaluateHealthImpact } from "@/lib/scheduling/evaluateHealthImpact";
import type { DiagnosisCategory, PhotoAngle, Severity, ImageQualityIssue } from "@prisma/client";
import type { DiagnosisImage, ImageMediaType } from "@/lib/ai/diagnosisEngine";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

interface DiagnoseRequestBody {
  images: {
    data:      string;
    mediaType: ImageMediaType;
    angle?:    PhotoAngle;
  }[];
  currentTempC?: number;
  humidity?:     number;
  lastWateredDays?: number;
}

// ─── POST /api/gardens/[gardenId]/plants/[plantId]/diagnose ───
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { gardenId, plantId } = await params;
    const body = await request.json() as DiagnoseRequestBody;

    // ── التحقق من المدخلات ──────────────────────────────────
    if (!body.images?.length) {
      return NextResponse.json({ error: "يجب إرسال صورة واحدة على الأقل" }, { status: 400 });
    }
    if (body.images.length > 5) {
      return NextResponse.json({ error: "الحد الأقصى 5 صور لكل جلسة" }, { status: 400 });
    }

    // ── جلب بيانات النبتة الكاملة ───────────────────────────
    const plant = await prisma.plant.findUnique({
      where:   { id: plantId, gardenId },
      include: {
        catalog:    true,
        schedules:  { where: { isActive: true } },
        healthLogs: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    const plantAgeDays   = Math.floor((Date.now() - plant.plantedAt.getTime()) / 86_400_000);
    const recentDiseases = plant.healthLogs
      .filter(l => l.diagnosisCategory)
      .map(l => l.diagnosisCategory as string);

    // ── إنشاء جلسة التشخيص ──────────────────────────────────
    const contextSnapshot = {
      plantNameAr:     plant.catalog.nameAr,
      plantNameEn:     plant.catalog.nameEn,
      plantAgeDays,
      location:        plant.location,
      soilType:        plant.soilType,
      lastWateredDays: body.lastWateredDays ?? 2,
      currentTempC:    body.currentTempC    ?? 35,
      humidity:        body.humidity        ?? 40,
      recentDiseases,
    };

    const session = await prisma.diagnosisSession.create({
      data: {
        plantId,
        status:          "ANALYZING",
        contextSnapshot,
        imageCount:      body.images.length,
      },
    });

    // ── حفظ الصور ───────────────────────────────────────────
    await prisma.diagnosisImage.createMany({
      data: body.images.map((img, i) => ({
        sessionId:    session.id,
        url:          `data:${img.mediaType};base64,${img.data.slice(0, 20)}...`, // مرجع مختصر
        order:        i + 1,
        angle:        img.angle ?? "AFFECTED_LEAF",
        qualityScore: null,
        qualityIssues: [] as ImageQualityIssue[],
      })),
    });

    // ── استدعاء Claude Vision ────────────────────────────────
    const images: DiagnosisImage[] = body.images.map(img => ({
      data:      img.data,
      mediaType: img.mediaType,
      angle:     img.angle,
    }));

    let analysisResult;
    try {
      analysisResult = await analyzeWithVision(images, contextSnapshot);
    } catch (aiError) {
      await prisma.diagnosisSession.update({
        where: { id: session.id },
        data:  { status: "DISMISSED" },
      });
      throw aiError;
    }

    const { result, rawResponse, processingMs } = analysisResult;

    // ── حفظ نتيجة الـ AI ────────────────────────────────────
    await prisma.aIAnalysisResult.create({
      data: {
        sessionId:           session.id,
        primaryCategory:     result.primaryDiagnosis.category as DiagnosisCategory,
        primaryNameAr:       result.primaryDiagnosis.nameAr,
        primaryNameEn:       result.primaryDiagnosis.nameEn,
        primaryConfidence:   result.primaryDiagnosis.confidence,
        primarySeverity:     result.primaryDiagnosis.severity as Severity,
        alternativeDiagnoses: result.alternativeDiagnoses,
        affectedParts:       result.affectedParts as never[],
        recommendedActions:  result.recommendedActions,
        fertilizersToAvoid:  result.fertilizersToAvoid as never[],
        fertilizersToUse:    result.fertilizersToUse   as never[],
        followUpDays:        result.followUpDays ?? null,
        followUpReason:      result.followUpReason ?? null,
        rawApiResponse:      rawResponse as never,
        modelUsed:           "claude-sonnet-4-6",
        processingMs,
      },
    });

    // ── توجيه القرار بناءً على الثقة ────────────────────────
    const decision = routeByConfidence(result);

    if (decision.decision === "NEEDS_BETTER_PHOTO") {
      await prisma.diagnosisSession.update({
        where: { id: session.id },
        data:  {
          status:                   "NEEDS_BETTER_PHOTO",
          additionalPhotoRequested: true,
          additionalPhotoGuidance:  decision.guidance,
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        decision:  "NEEDS_BETTER_PHOTO",
        guidance:  decision.guidance,
        confidence: result.primaryDiagnosis.confidence,
      });
    }

    if (decision.decision === "NEEDS_CONFIRMATION") {
      await prisma.diagnosisSession.update({
        where: { id: session.id },
        data:  { status: "AWAITING_CONFIRMATION" },
      });

      const impact = evaluateHealthImpact(
        result.primaryDiagnosis.category as DiagnosisCategory,
        plant.schedules,
      );

      return NextResponse.json({
        sessionId:   session.id,
        decision:    "NEEDS_CONFIRMATION",
        diagnosis:   result.primaryDiagnosis,
        alternatives: result.alternativeDiagnoses,
        impact: {
          userMessage:  impact.userMessage,
          pauseCount:   impact.pauseCount,
          triggerCount: impact.triggerCount,
        },
        recommendedActions: result.recommendedActions,
        processingMs,
      });
    }

    // ── AUTO_APPLY: ثقة > 85% ────────────────────────────────
    const applied = await applyDiagnosis({
      sessionId:  session.id,
      plantId,
      result,
      schedules:  plant.schedules,
    });

    return NextResponse.json({
      sessionId:   session.id,
      decision:    "AUTO_APPLIED",
      diagnosis:   result.primaryDiagnosis,
      impact:      applied.impact,
      healthLogId: applied.healthLogId,
      processingMs,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /diagnose]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── تطبيق التشخيص على الـ DB ────────────────────────────────
async function applyDiagnosis({
  sessionId, plantId, result, schedules,
}: {
  sessionId: string;
  plantId:   string;
  result:    Awaited<ReturnType<typeof analyzeWithVision>>["result"];
  schedules: { id: string; type: import("@prisma/client").ScheduleType; isActive: boolean }[];
}) {
  const impact = evaluateHealthImpact(
    result.primaryDiagnosis.category as DiagnosisCategory,
    schedules,
  );

  const newStatus =
    result.primaryDiagnosis.severity === "CRITICAL" ? "CRITICAL"  :
    result.primaryDiagnosis.severity === "HIGH"     ? "DISEASED"  :
                                                      "STRESSED";

  return prisma.$transaction(async (tx) => {
    // 1. أنشئ سجل الصحة
    const healthLog = await tx.healthLog.create({
      data: {
        plantId,
        diagnosis:            result.primaryDiagnosis.nameAr,
        diagnosisCategory:    result.primaryDiagnosis.category as DiagnosisCategory,
        severity:             result.primaryDiagnosis.severity as Severity,
        treatment:            result.recommendedActions.join(" — "),
        scheduleRulesApplied: true,
        diagnosisSessionId:   sessionId,
      },
    });

    // 2. حدّث حالة النبتة
    await tx.plant.update({
      where: { id: plantId },
      data:  { healthStatus: newStatus, lastInspection: new Date() },
    });

    // 3. طبّق إيقاف الجداول
    for (const action of impact.actions) {
      if (action.type === "PAUSE") {
        await tx.schedulePause.create({
          data: {
            scheduleId:            action.scheduleId,
            healthLogId:           healthLog.id,
            reason:                "DISEASE_ACTIVE",
            reasonDetail:          action.reasonDetail,
            resumeAt:              new Date(Date.now() + action.resumeAfterDays * 86_400_000),
            resumeDosageMultiplier: action.resumeDosage,
          },
        });
        await tx.schedule.update({
          where: { id: action.scheduleId },
          data:  { isActive: false },
        });
      }
    }

    // 4. أغلق الجلسة
    await tx.diagnosisSession.update({
      where: { id: sessionId },
      data:  { status: "APPLIED", healthLog: { connect: { id: healthLog.id } } },
    });

    return { healthLogId: healthLog.id, impact };
  });
}
