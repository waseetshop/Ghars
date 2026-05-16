import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateHealthImpact } from "@/lib/scheduling/evaluateHealthImpact";
import type { ConfirmationDecision, DiagnosisCategory, Severity } from "@prisma/client";

type Params = { params: Promise<{ gardenId: string; plantId: string }> };

interface ConfirmBody {
  sessionId:         string;
  decision:          ConfirmationDecision;
  userNote?:         string;
  overrideCategory?: DiagnosisCategory; // إذا أراد المستخدم تصحيح التشخيص
  overrideNote?:     string;
}

// ─── POST /api/.../diagnose/confirm ───────────────────────────
// يُستدعى بعد عرض نتيجة الثقة 60-85% على المستخدم وانتظار موافقته
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { plantId } = await params;
    const body = await request.json() as ConfirmBody;

    if (!body.sessionId || !body.decision) {
      return NextResponse.json({ error: "sessionId و decision مطلوبان" }, { status: 400 });
    }

    // ── جلب الجلسة والنتيجة ──────────────────────────────────
    const session = await prisma.diagnosisSession.findUnique({
      where:   { id: body.sessionId },
      include: { result: true },
    });

    if (!session) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }
    if (session.status !== "AWAITING_CONFIRMATION") {
      return NextResponse.json(
        { error: `حالة الجلسة "${session.status}" لا تقبل التأكيد` },
        { status: 409 }
      );
    }
    if (!session.result) {
      return NextResponse.json({ error: "لا توجد نتيجة تحليل للجلسة" }, { status: 422 });
    }

    // ── حفظ قرار المستخدم ───────────────────────────────────
    await prisma.diagnosisConfirmation.create({
      data: {
        sessionId:        body.sessionId,
        decision:         body.decision,
        userNote:         body.userNote,
        overrideCategory: body.overrideCategory,
        overrideNote:     body.overrideNote,
      },
    });

    if (body.decision === "REJECTED") {
      await prisma.diagnosisSession.update({
        where: { id: body.sessionId },
        data:  { status: "DISMISSED" },
      });
      return NextResponse.json({ message: "تم رفض التشخيص وإغلاق الجلسة." });
    }

    // ── تحديد الفئة النهائية (الأصلية أو المُصحَّحة) ─────────
    const finalCategory: DiagnosisCategory = body.overrideCategory
      ?? session.result.primaryCategory;

    const finalSeverity: Severity = body.overrideCategory
      ? "MEDIUM"  // قيمة افتراضية معقولة عند التصحيح اليدوي
      : session.result.primarySeverity;

    const diagnosisNameAr = body.overrideCategory
      ? body.overrideNote ?? body.overrideCategory
      : session.result.primaryNameAr;

    // ── جلب الجداول النشطة للنبتة ────────────────────────────
    const plant = await prisma.plant.findUnique({
      where:   { id: plantId },
      include: { schedules: { where: { isActive: true } } },
    });

    if (!plant) {
      return NextResponse.json({ error: "النبتة غير موجودة" }, { status: 404 });
    }

    const impact = evaluateHealthImpact(finalCategory, plant.schedules);

    const newStatus =
      finalSeverity === "CRITICAL" ? "CRITICAL"  :
      finalSeverity === "HIGH"     ? "DISEASED"  :
                                     "STRESSED";

    // ── تطبيق التشخيص على الـ DB ─────────────────────────────
    const healthLog = await prisma.$transaction(async (tx) => {
      const log = await tx.healthLog.create({
        data: {
          plantId,
          diagnosis:            diagnosisNameAr,
          diagnosisCategory:    finalCategory,
          severity:             finalSeverity,
          treatment:            session.result!.recommendedActions.join(" — "),
          scheduleRulesApplied: true,
          diagnosisSessionId:   body.sessionId,
        },
      });

      await tx.plant.update({
        where: { id: plantId },
        data:  { healthStatus: newStatus, lastInspection: new Date() },
      });

      for (const action of impact.actions) {
        if (action.type === "PAUSE") {
          await tx.schedulePause.create({
            data: {
              scheduleId:            action.scheduleId,
              healthLogId:           log.id,
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

      await tx.diagnosisSession.update({
        where: { id: body.sessionId },
        data:  { status: "APPLIED", healthLog: { connect: { id: log.id } } },
      });

      return log;
    });

    return NextResponse.json({
      healthLogId:     healthLog.id,
      finalCategory,
      userMessage:     impact.userMessage,
      schedulespaused: impact.pauseCount,
      triggersScheduled: impact.triggerCount,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /diagnose/confirm]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
