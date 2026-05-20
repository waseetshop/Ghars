/**
 * حساب الـ slot التالي لجهاز الري الذكي بناءً على timerTimes و timerIntervalDays.
 *
 * - يومياً (intervalDays = 1): يبحث عن أقرب وقت محدد في نفس اليوم أو اليوم التالي
 * - كل N أيام (intervalDays > 1): يأخذ أول وقت في اليوم N القادم من wateredAt
 */
export function getNextSmartTimerSlot(
  timerTimes: string[],   // ["07:00", "18:00"]
  timerIntervalDays: number,
  wateredAt: Date,
): Date {
  const sorted = [...timerTimes].sort();          // ترتيب تصاعدي
  const hasSpecificTimes = sorted.length > 0;

  if (!hasSpecificTimes || timerIntervalDays > 1) {
    // كل N أيام → أول وقت بعد N أيام
    const base = new Date(wateredAt);
    base.setDate(base.getDate() + timerIntervalDays);
    if (hasSpecificTimes) {
      const [h, m] = sorted[0].split(":").map(Number);
      base.setHours(h, m, 0, 0);
    }
    return base;
  }

  // يومياً → أقرب slot بعد wateredAt (نفس اليوم أو الغد)
  for (const t of sorted) {
    const [h, m] = t.split(":").map(Number);
    const slot = new Date(
      wateredAt.getFullYear(),
      wateredAt.getMonth(),
      wateredAt.getDate(),
      h, m, 0, 0,
    );
    if (slot > wateredAt) return slot;
  }

  // لا يوجد slot اليوم → أول slot الغد
  const tomorrow = new Date(wateredAt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [h, m] = sorted[0].split(":").map(Number);
  tomorrow.setHours(h, m, 0, 0);
  return tomorrow;
}
