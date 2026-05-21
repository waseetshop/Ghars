import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agricultural-stars/today
 * يُعيد النجم الزراعي لليوم الحالي مع باقي الأيام
 */
export async function GET() {
  try {
    const stars = await prisma.agriculturalStar.findMany({
      include: { season: { select: { nameAr: true, order: true } } },
      orderBy: { orderInYear: "asc" },
    });

    if (stars.length === 0) {
      return NextResponse.json({ data: null });
    }

    const today = new Date();
    const year  = today.getFullYear();
    const month = today.getMonth() + 1; // 1-12
    const day   = today.getDate();

    // حساب رقم اليوم في السنة (بدون اعتبار السنة الكبيسة)
    const todayDayOfYear = dayOfYear(year, month, day);

    let currentStar     = stars[0];
    let daysRemaining   = 0;
    let daysIntoStar    = 0;

    for (let i = 0; i < stars.length; i++) {
      const star     = stars[i];
      const starDoy  = dayOfYear(year, star.startMonth, star.startDay);
      const nextStar = stars[(i + 1) % stars.length];

      // نجم العام القادم إذا لف الدور
      let nextDoy = dayOfYear(year, nextStar.startMonth, nextStar.startDay);
      if (nextDoy <= starDoy) nextDoy += 365; // يوم ضبط الالتفاف (ديسمبر → يناير)

      // نُصحح الـ starDoy إذا كان في نهاية العام وnow في بداية العام
      let adjustedToday = todayDayOfYear;
      if (adjustedToday < starDoy && starDoy > 300) {
        adjustedToday += 365;
      }

      if (adjustedToday >= starDoy && adjustedToday < nextDoy) {
        currentStar   = star;
        daysIntoStar  = adjustedToday - starDoy;
        daysRemaining = nextDoy - adjustedToday - 1;
        break;
      }
    }

    return NextResponse.json({
      data: {
        id:                 currentStar.id,
        nameAr:             currentStar.nameAr,
        season:             currentStar.season.nameAr,
        seasonOrder:        currentStar.season.order,
        startMonth:         currentStar.startMonth,
        startDay:           currentStar.startDay,
        durationDays:       currentStar.durationDays,
        orderInYear:        currentStar.orderInYear,
        weatherDescription: currentStar.weatherDescription,
        plantingAdvice:     currentStar.plantingAdvice,
        generalAdvice:      currentStar.generalAdvice,
        daysRemaining,
        daysIntoStar,
      },
    });
  } catch (error) {
    console.error("[GET /api/agricultural-stars/today]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** يُعيد رقم اليوم في السنة (1 = 1 يناير) */
function dayOfYear(year: number, month: number, day: number): number {
  const start = new Date(year, 0, 0);
  const date  = new Date(year, month - 1, day);
  const diff  = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}
