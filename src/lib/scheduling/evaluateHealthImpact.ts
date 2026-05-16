import type { DiagnosisCategory, ScheduleType } from "@prisma/client";

type ScheduleSlim = { id: string; type: ScheduleType; isActive: boolean };

export type HealthAction =
  | { type: "PAUSE";   scheduleId: string; reasonDetail: string; resumeAfterDays: number; resumeDosage: number }
  | { type: "TRIGGER"; scheduleType: ScheduleType; urgency: "IMMEDIATE" | "TODAY" }
  | { type: "MODIFY_WATERING"; scheduleId: string; frequencyMultiplier: number; reasonDetail: string };

interface RuleSet {
  pauseTypes:      ScheduleType[];
  triggerTypes:    { type: ScheduleType; urgency: "IMMEDIATE" | "TODAY" }[];
  waterModifier?:  number;
  resumeDosage:    number;
  resumeAfterDays: number;
  userMessage:     string;
}

// ─── مصفوفة القرار: 14 تشخيص × أنواع الجداول ────────────────
const RULES: Record<DiagnosisCategory, RuleSet> = {
  FUNGAL_DISEASE: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO", "CALCIUM_TREATMENT"],
    triggerTypes:    [{ type: "FUNGICIDE", urgency: "IMMEDIATE" }],
    waterModifier:   0.40,
    resumeDosage:    0.50,
    resumeAfterDays: 14,
    userMessage:     "التسميد يُغذّي الفطر أيضاً — أوقفناه حتى التعافي. ابدأ بالمبيد الفطري فوراً.",
  },
  ROOT_ROT: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO", "CALCIUM_TREATMENT", "WATERING"],
    triggerTypes:    [{ type: "FUNGICIDE", urgency: "IMMEDIATE" }],
    waterModifier:   0.20,
    resumeDosage:    0.30,
    resumeAfterDays: 21,
    userMessage:     "الجذور المتعفنة لا تمتص شيئاً — خففّ الري بشكل جذري وأوقف جميع الأسمدة.",
  },
  SPIDER_MITE: {
    pauseTypes:      ["FERTILIZING_NPK"],
    triggerTypes:    [{ type: "INSECTICIDE", urgency: "TODAY" }],
    waterModifier:   1.10,
    resumeDosage:    1.00,
    resumeAfterDays: 10,
    userMessage:     "النيتروجين يُسرّع تكاثر العنكبوت الأحمر — أوقفناه. ارش زيت النيم صباحاً.",
  },
  SALT_BURN: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO", "CALCIUM_TREATMENT"],
    triggerTypes:    [],
    waterModifier:   2.50,
    resumeDosage:    0.50,
    resumeAfterDays: 7,
    userMessage:     "أوقف جميع الأسمدة واروِ بغزارة 3 مرات متتالية لغسل تراكم الأملاح.",
  },
  HEAT_STRESS: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO"],
    triggerTypes:    [],
    waterModifier:   0.60,
    resumeDosage:    1.00,
    resumeAfterDays: 3,
    userMessage:     "موجة الحر تُحرق الجذور مع الأسمدة — انتظر انخفاض الحرارة.",
  },
  NUTRIENT_DEF_NITROGEN: {
    pauseTypes:      [],
    triggerTypes:    [{ type: "FERTILIZING_NPK", urgency: "TODAY" }],
    resumeDosage:    1.00,
    resumeAfterDays: 0,
    userMessage:     "نقص نيتروجين واضح — أضف سماداً خضرياً 30-10-10 اليوم مع الري.",
  },
  NUTRIENT_DEF_CALCIUM: {
    pauseTypes:      [],
    triggerTypes:    [{ type: "CALCIUM_TREATMENT", urgency: "IMMEDIATE" }],
    resumeDosage:    1.00,
    resumeAfterDays: 0,
    userMessage:     "نقص الكالسيوم يُسبب تعفن قمم الثمار — أضف MegaCal الآن.",
  },
  NUTRIENT_DEF_IRON: {
    pauseTypes:      [],
    triggerTypes:    [{ type: "FERTILIZING_MICRO", urgency: "TODAY" }],
    resumeDosage:    1.00,
    resumeAfterDays: 0,
    userMessage:     "نقص حديد — رش حديد مخلبي على الأوراق مباشرة.",
  },
  PRUNING_RECOVERY: {
    pauseTypes:      ["FERTILIZING_NPK"],
    triggerTypes:    [],
    resumeDosage:    0.75,
    resumeAfterDays: 10,
    userMessage:     "الجروح المفتوحة لا تتحمل التسميد — نستأنف بعد أسبوعين بنصف الجرعة.",
  },
  OVERWATERING: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO"],
    triggerTypes:    [],
    waterModifier:   0.30,
    resumeDosage:    0.75,
    resumeAfterDays: 10,
    userMessage:     "إفراط في الري — اتركه يجف تماماً قبل الري التالي.",
  },
  UNDERWATERING: {
    pauseTypes:      [],
    triggerTypes:    [],
    waterModifier:   1.50,
    resumeDosage:    1.00,
    resumeAfterDays: 0,
    userMessage:     "عطش — أعد الري فوراً بكمية معتدلة.",
  },
  BACTERIAL_DISEASE: {
    pauseTypes:      ["FERTILIZING_NPK", "FERTILIZING_MICRO"],
    triggerTypes:    [],
    resumeDosage:    0.50,
    resumeAfterDays: 14,
    userMessage:     "إصابة بكتيرية — أوقف التسميد وركّز على عزل النبتة والعلاج.",
  },
  SCALE_INSECT: {
    pauseTypes:      ["FERTILIZING_NPK"],
    triggerTypes:    [{ type: "INSECTICIDE", urgency: "TODAY" }],
    resumeDosage:    1.00,
    resumeAfterDays: 7,
    userMessage:     "حشرة الدرع — رش زيت معدني مخفف وأوقف النيتروجين مؤقتاً.",
  },
  MEALYBUG: {
    pauseTypes:      ["FERTILIZING_NPK"],
    triggerTypes:    [{ type: "INSECTICIDE", urgency: "TODAY" }],
    resumeDosage:    1.00,
    resumeAfterDays: 7,
    userMessage:     "بق دقيقي — امسح بقطنة بالكحول ثم رش صابون البوتاسيوم.",
  },
};

export function evaluateHealthImpact(
  diagnosisCategory: DiagnosisCategory,
  schedules:         ScheduleSlim[],
): {
  actions:     HealthAction[];
  userMessage: string;
  pauseCount:  number;
  triggerCount: number;
} {
  const rules   = RULES[diagnosisCategory];
  const actions: HealthAction[] = [];

  for (const schedule of schedules) {
    if (!schedule.isActive) continue;

    if (rules.pauseTypes.includes(schedule.type)) {
      actions.push({
        type:            "PAUSE",
        scheduleId:      schedule.id,
        reasonDetail:    rules.userMessage,
        resumeAfterDays: rules.resumeAfterDays,
        resumeDosage:    rules.resumeDosage,
      });
    }

    if (schedule.type === "WATERING" && rules.waterModifier !== undefined) {
      actions.push({
        type:                "MODIFY_WATERING",
        scheduleId:          schedule.id,
        frequencyMultiplier: rules.waterModifier,
        reasonDetail:        rules.userMessage,
      });
    }
  }

  for (const trigger of rules.triggerTypes) {
    actions.push({ type: "TRIGGER", scheduleType: trigger.type, urgency: trigger.urgency });
  }

  return {
    actions,
    userMessage:  rules.userMessage,
    pauseCount:   actions.filter(a => a.type === "PAUSE").length,
    triggerCount: actions.filter(a => a.type === "TRIGGER").length,
  };
}
