import { anthropic } from "@/lib/anthropic";
import type { DiagnosisCategory } from "@prisma/client";

// ─── أنواع الصور المقبولة ─────────────────────────────────────
export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface DiagnosisImage {
  data:      string;         // base64
  mediaType: ImageMediaType;
  angle?:    string;
}

// ─── هيكل الاستجابة المطلوبة من Claude ───────────────────────
export interface VisionDiagnosisResult {
  primaryDiagnosis: {
    category:    DiagnosisCategory;
    nameAr:      string;
    nameEn:      string;
    confidence:  number;       // 0.0 – 1.0
    severity:    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    explanation: string;       // جملة واحدة للمزارع
  };
  alternativeDiagnoses: {
    category:   DiagnosisCategory;
    nameAr:     string;
    confidence: number;
  }[];
  affectedParts:        string[];
  recommendedActions:   string[];
  fertilizersToAvoid:   string[];
  fertilizersToUse:     string[];
  additionalPhotoNeeded:    boolean;
  additionalPhotoGuidance?: string;
  followUpDays?:        number;
  followUpReason?:      string;
}

// ─── قرار التوجيه بناءً على الثقة ────────────────────────────
export type DiagnosisDecision =
  | { decision: "AUTO_APPLY";           result: VisionDiagnosisResult }
  | { decision: "NEEDS_CONFIRMATION";   result: VisionDiagnosisResult }
  | { decision: "NEEDS_BETTER_PHOTO";   guidance: string };

// ─── بناء الـ prompt السياقي ──────────────────────────────────
function buildPrompt(ctx: {
  plantNameAr:     string;
  plantNameEn:     string;
  plantAgeDays:    number;
  location:        string;
  soilType:        string;
  lastWateredDays: number;
  currentTempC:    number;
  humidity:        number;
  recentDiseases:  string[];
}): string {
  const age =
    ctx.plantAgeDays < 90   ? "شتلة صغيرة (أقل من 3 أشهر)" :
    ctx.plantAgeDays < 365  ? "نبتة فتية (3–12 شهر)"        :
    ctx.plantAgeDays < 1095 ? "نبتة ناضجة (1–3 سنوات)"      :
                              "شجرة راسخة (أكثر من 3 سنوات)";

  const history = ctx.recentDiseases.length > 0
    ? `تاريخ مرضي: ${ctx.recentDiseases.slice(0, 3).join("، ")}.`
    : "لا تاريخ مرضي سابق.";

  const validCategories: DiagnosisCategory[] = [
    "FUNGAL_DISEASE","BACTERIAL_DISEASE","SPIDER_MITE","SCALE_INSECT","MEALYBUG",
    "SALT_BURN","ROOT_ROT","NUTRIENT_DEF_NITROGEN","NUTRIENT_DEF_IRON",
    "NUTRIENT_DEF_CALCIUM","HEAT_STRESS","OVERWATERING","UNDERWATERING","PRUNING_RECOVERY",
  ];

  return `أنت خبير زراعي متخصص في تشخيص أمراض النباتات في المنطقة العربية ذات المناخ الحار.

**معلومات النبتة:**
- النوع: ${ctx.plantNameAr} (${ctx.plantNameEn})
- العمر: ${age}
- البيئة: ${ctx.location} | التربة: ${ctx.soilType}
- آخر ري: منذ ${ctx.lastWateredDays} يوم
- الحرارة: ${ctx.currentTempC}°م | الرطوبة: ${ctx.humidity}%
- ${history}

**المطلوب:** حلّل الصورة/الصور وأعطني تشخيصاً دقيقاً في JSON فقط، بدون أي نص خارجه:

{
  "primaryDiagnosis": {
    "category": "اختر واحدة فقط من: ${validCategories.join(" | ")}",
    "nameAr": "اسم المشكلة بالعربية",
    "nameEn": "Problem name in English",
    "confidence": 0.0,
    "severity": "LOW | MEDIUM | HIGH | CRITICAL",
    "explanation": "جملة واحدة تشرح لماذا هذا هو التشخيص بناءً على ما تراه"
  },
  "alternativeDiagnoses": [
    { "category": "...", "nameAr": "...", "confidence": 0.0 }
  ],
  "affectedParts": ["LEAVES | LEAF_UNDERSIDE | STEM | ROOTS | FLOWERS | FRUIT | SOIL | BARK"],
  "recommendedActions": ["إجراء 1", "إجراء 2", "إجراء 3"],
  "fertilizersToAvoid": ["NPK_HIGH_N | NPK_BALANCED | ..."],
  "fertilizersToUse": ["FUNGICIDE_COPPER | IRON_CHELATE | CALCIUM_BORON | ..."],
  "additionalPhotoNeeded": false,
  "additionalPhotoGuidance": null,
  "followUpDays": null,
  "followUpReason": null
}`;
}

// ─── استدعاء Claude Vision ────────────────────────────────────
export async function analyzeWithVision(
  images: DiagnosisImage[],
  context: Parameters<typeof buildPrompt>[0],
): Promise<{ result: VisionDiagnosisResult; rawResponse: unknown; processingMs: number }> {
  if (images.length === 0) throw new Error("لا توجد صور للتحليل");

  const start   = Date.now();
  const prompt  = buildPrompt(context);

  const imageBlocks = images.map(img => ({
    type:   "image" as const,
    source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
  }));

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1024,
    messages:   [{
      role:    "user",
      content: [
        ...imageBlocks,
        { type: "text", text: prompt },
      ],
    }],
  });

  const processingMs = Date.now() - start;
  const rawText      = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude لم يُعد JSON صحيحاً. الاستجابة: ${rawText.slice(0, 200)}`);

  const result = JSON.parse(jsonMatch[0]) as VisionDiagnosisResult;

  // تحقق بسيط من الحقول الأساسية
  if (!result.primaryDiagnosis?.category || typeof result.primaryDiagnosis?.confidence !== "number") {
    throw new Error("هيكل الاستجابة غير مكتمل");
  }

  return { result, rawResponse: response, processingMs };
}

// ─── توجيه القرار بناءً على الثقة ────────────────────────────
export function routeByConfidence(result: VisionDiagnosisResult): DiagnosisDecision {
  const confidence = result.primaryDiagnosis.confidence;

  if (result.additionalPhotoNeeded || confidence < 0.60) {
    return {
      decision: "NEEDS_BETTER_PHOTO",
      guidance: result.additionalPhotoGuidance
        ?? "صوّر الجزء المتضرر من مسافة 15–20 سم في إضاءة طبيعية جيدة.",
    };
  }

  if (confidence >= 0.85) return { decision: "AUTO_APPLY", result };

  return { decision: "NEEDS_CONFIRMATION", result };
}
