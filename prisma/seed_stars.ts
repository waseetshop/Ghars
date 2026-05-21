/**
 * seed_stars.ts
 * بيانات الروزنامة الزراعية الفلكية — الأنواء الـ28
 *
 * المعايرة: النعائم (الشباط) يبدأ 15 يناير (من المفكرة الزراعية لوزارة الزراعة السعودية)
 * كل نجم = 13 يوماً تقريباً، الدورة الكاملة = 364 يوماً
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── الفصول ─────────────────────────────────────────────────────
const SEASONS = [
  { id: 1, nameAr: "الشتاء",  order: 1 },
  { id: 2, nameAr: "الربيع",  order: 2 },
  { id: 3, nameAr: "الصيف",   order: 3 },
  { id: 4, nameAr: "الخريف",  order: 4 },
];

// ─── الأنواء الـ28 ──────────────────────────────────────────────
// الترتيب: بدءاً من أول نجم شتوي (الإكليل، 7 ديسمبر)
// startMonth/startDay: تاريخ طلوع النجم (ميلادي)
// المصدر: المفكرة الزراعية السادسة (وزارة الزراعة السعودية) + التراث الفلكي النجدي
const STARS = [
  // ══════════════════════════ الشتاء ══════════════════════════
  {
    id: 1,
    seasonId: 1,
    orderInYear: 1,
    nameAr: "الإكليل",
    startMonth: 12, startDay: 7,
    durationDays: 13,
    weatherDescription: "بداية الشتاء الفعلي، برد يشتد تدريجياً، ليالٍ باردة ونهارات معتدلة، قد تهطل أمطار في المناطق الغربية والجنوبية",
    plantingAdvice: "تُزرع الخضروات الشتوية كالبصل والثوم والجزر والبقدونس، تُغرس فسائل الأشجار المثمرة في المناطق الدافئة نسبياً",
    generalAdvice: "بداية عمليات التقليم الشتوي للأشجار المثمرة، تحضير التربة للموسم الشتوي",
  },
  {
    id: 2,
    seasonId: 1,
    orderInYear: 2,
    nameAr: "القلب",
    startMonth: 12, startDay: 20,
    durationDays: 13,
    weatherDescription: "أقصر نهار في السنة (الانقلاب الشتوي)، برد شديد وصقيع في المرتفعات والمناطق الداخلية، طقس بارد جاف",
    plantingAdvice: "تُزرع الخضروات الورقية (السبانخ، الجرجير، الخس) في المناطق المعتدلة، تُزرع التوابل الشتوية",
    generalAdvice: "حماية النباتات الحساسة من الصقيع بتغطيتها ليلاً، الري في منتصف النهار وليس صباحاً",
  },
  {
    id: 3,
    seasonId: 1,
    orderInYear: 3,
    nameAr: "الشولة",
    startMonth: 1, startDay: 2,
    durationDays: 13,
    weatherDescription: "برودة تصل أوجها، أيام الحزم الشتوية الباردة، أمطار وغيوم كثيفة في بعض المناطق، صقيع ليلي متكرر",
    plantingAdvice: "يُكتفى بالعناية بالمحاصيل القائمة، الزراعة الجديدة محدودة جداً في الأماكن المكشوفة",
    generalAdvice: "صيانة معدات الري وفحصها، تدفئة بيوت التربية المحمية، تغطية البيارات بالألياف",
  },
  {
    id: 4,
    seasonId: 1,
    orderInYear: 4,
    nameAr: "النعائم (الشباط)",
    startMonth: 1, startDay: 15,
    durationDays: 13,
    weatherDescription: "يشتد البرد والصقيع، وتستمر البرودة في الزيادة، وتكثر العواصف الشتوية والأمطار الغزيرة في مناطق عدة",
    plantingAdvice: "تُغرس فسائل النخيل في المناطق الدافئة، تُزرع البواكير من الأشجار المثمرة، يُزرع البرسيم والخضار الشتوية في الأماكن المحمية",
    generalAdvice: "يُقطع فيه سعف النخيل ويُستخدم في عمليات التصويت، يُحذر من ري الأشجار وقت الفجر تجنباً لتجمد المياه على الجذور والأوراق",
  },
  {
    id: 5,
    seasonId: 1,
    orderInYear: 5,
    nameAr: "البلدة",
    startMonth: 1, startDay: 28,
    durationDays: 13,
    weatherDescription: "تبدأ بوادر انكسار الشتاء تدريجياً، ليالٍ لا تزال باردة لكن النهارات تطول قليلاً، أمطار متقطعة",
    plantingAdvice: "تُزرع درنات البطاطا والبصل والثوم، تُستأنف عمليات غرس الأشجار، تُزرع بذور الخضروات الشتوية",
    generalAdvice: "بدء التخطيط للموسم الزراعي القادم، تجديد التسميد العضوي للتربة",
  },
  {
    id: 6,
    seasonId: 1,
    orderInYear: 6,
    nameAr: "سعد الذابح",
    startMonth: 2, startDay: 10,
    durationDays: 13,
    weatherDescription: "يخف البرد تدريجياً، أمطار خفيفة وأحياناً رياح دافئة تنبئ بالربيع، الجو لا يزال يتطلب الحذر",
    plantingAdvice: "تُزرع أشتال الطماطم والفلفل في البيوت المحمية، يُزرع القمح والشعير في المناطق الباردة، بدء إعداد مشاتل الصيف",
    generalAdvice: "تحضير الأراضي للموسم الربيعي، إضافة السماد العضوي للتربة",
  },
  {
    id: 7,
    seasonId: 1,
    orderInYear: 7,
    nameAr: "سعد بلع",
    startMonth: 2, startDay: 23,
    durationDays: 13,
    weatherDescription: "اعتدال تدريجي واضح، نهايات الشتاء والانتقال للربيع، أمطار ربيعية مبكرة محتملة في بعض المناطق",
    plantingAdvice: "تُزرع بذور الخضروات الصيفية في البيوت المحمية، تُبدأ الزراعة المبكرة في المناطق الدافئة",
    generalAdvice: "تسميد الأشجار المثمرة بسماد متوازن، مراقبة ظهور الآفات والأمراض الأولى مع رفع درجات الحرارة",
  },

  // ══════════════════════════ الربيع ══════════════════════════
  {
    id: 8,
    seasonId: 2,
    orderInYear: 8,
    nameAr: "سعد السعود",
    startMonth: 3, startDay: 8,
    durationDays: 13,
    weatherDescription: "ربيع حقيقي بهيج، اعتدال الجو وانتعاش الهواء، أمطار ربيعية منعشة، أفضل أوقات السنة زراعياً",
    plantingAdvice: "تُزرع معظم أنواع الخضروات والمحاصيل، تُغرس الشتلات في الأرض الدائمة، أفضل وقت لزراعة الأشجار المثمرة",
    generalAdvice: "موسم النشاط الزراعي الكامل، مكافحة الآفات الربيعية المبكرة، ري منتظم ومنتعش",
  },
  {
    id: 9,
    seasonId: 2,
    orderInYear: 9,
    nameAr: "سعد الأخبية",
    startMonth: 3, startDay: 21,
    durationDays: 13,
    weatherDescription: "ربيع مثالي معتدل، أمطار ربيعية جيدة في بعض المناطق، رياح معتدلة، طقس مثالي للعمل في الحقل",
    plantingAdvice: "تُزرع المحاصيل الصيفية المبكرة، تُزرع الدلاعيات (البطيخ والشمام) في الأماكن الدافئة، تُزرع الفاصولياء والخيار",
    generalAdvice: "مكافحة آفات الربيع الحشرية، التسميد الداعم لمحاصيل الخضروات النامية",
  },
  {
    id: 10,
    seasonId: 2,
    orderInYear: 10,
    nameAr: "الفرغ المقدم",
    startMonth: 4, startDay: 3,
    durationDays: 13,
    weatherDescription: "ارتفاع تدريجي في الحرارة نهاراً، ليالٍ لا تزال منعشة، أمطار أقل وطقس أكثر جفافاً",
    plantingAdvice: "تُزرع البطاطا والبطيخ والشمام، تُغرس نباتات الزينة وأشجار الظل، آخر موعد لبعض الخضروات الشتوية",
    generalAdvice: "تخفيف الري تدريجياً مع ارتفاع الحرارة ورفع تكراره، التسميد الربيعي للأشجار المثمرة",
  },
  {
    id: 11,
    seasonId: 2,
    orderInYear: 11,
    nameAr: "الفرغ المؤخر",
    startMonth: 4, startDay: 16,
    durationDays: 13,
    weatherDescription: "حرارة معتدلة مائلة للدفء، رياح جنوبية وجنوبية غربية، شهر مناسب قبل الحر الشديد",
    plantingAdvice: "آخر موعد لزراعة الخضروات الشتوية، تُزرع المحاصيل الصيفية كالذرة والبامياء، تُغرس أشجار الظل",
    generalAdvice: "تقليل رش المبيدات في موسم الإزهار حفاظاً على الملقحات، زيادة دورات الري",
  },
  {
    id: 12,
    seasonId: 2,
    orderInYear: 12,
    nameAr: "بطن الحوت",
    startMonth: 4, startDay: 29,
    durationDays: 13,
    weatherDescription: "حرارة صاعدة، جفاف وسماء صافية، رياح جافة تزداد سرعتها أحياناً",
    plantingAdvice: "تُزرع المحاصيل الصيفية الرئيسية كالفلفل والباذنجان والطماطم الصيفية، تُزرع نباتات العطور والتوابل الصيفية",
    generalAdvice: "زيادة دورات الري ومراقبة التربة يومياً، تغطية التربة بالمهاد (الملش) للحفاظ على الرطوبة",
  },
  {
    id: 13,
    seasonId: 2,
    orderInYear: 13,
    nameAr: "الشرطين",
    startMonth: 5, startDay: 12,
    durationDays: 13,
    weatherDescription: "حرارة عالية ملموسة، هواء جاف، بداية الفترة الحارة في المناطق الداخلية",
    plantingAdvice: "تُزرع الذرة والبامياء والبصل الصيفي، تُزرع المحاصيل الخريفية مبكراً في المناطق الباردة",
    generalAdvice: "بداية موسم الحر، تكثيف الري وتحويله للفجر والمساء، مراقبة علامات الإجهاد الحراري للنباتات",
  },
  {
    id: 14,
    seasonId: 2,
    orderInYear: 14,
    nameAr: "البطين",
    startMonth: 5, startDay: 25,
    durationDays: 13,
    weatherDescription: "حرارة متصاعدة، رياح جنوبية وجنوبية غربية دافئة وجافة، نهايات الربيع الزراعي",
    plantingAdvice: "تُزرع المحاصيل الصيفية المتأخرة، تُزرع العروة الأولى من البطيخ في الجهات الباردة، تُزرع الكوسا والقرع",
    generalAdvice: "نهاية موسم الربيع، تحضير التربة لمحاصيل الصيف، إزالة بقايا المحاصيل الربيعية",
  },

  // ══════════════════════════ الصيف ══════════════════════════
  {
    id: 15,
    seasonId: 3,
    orderInYear: 15,
    nameAr: "الثريا",
    startMonth: 6, startDay: 7,
    durationDays: 13,
    weatherDescription: "حرارة مرتفعة وأيام طويلة، جفاف شبه تام في المناطق الداخلية، رطوبة ساحلية في المناطق الغربية",
    plantingAdvice: "يُعتنى بالمحاصيل القائمة وصيانتها، الزراعة الجديدة محدودة في الهواء الطلق، يناسب البيوت المحمية",
    generalAdvice: "حماية النباتات من الحر الشديد بالتظليل، الري المسائي والفجري ضرورة لا اختيار",
  },
  {
    id: 16,
    seasonId: 3,
    orderInYear: 16,
    nameAr: "الدبران",
    startMonth: 6, startDay: 20,
    durationDays: 13,
    weatherDescription: "قمة الحر وأطول نهار في السنة (الانقلاب الصيفي)، حرارة شديدة قد تتخللها رياح رطبة ساحلية",
    plantingAdvice: "فسائل النخيل في طور النمو النشط، تُعنى عناية فائقة، يُتجنب الغرس الجديد في الهواء الطلق",
    generalAdvice: "ري غزير فجري ومسائي، تغطية التربة بالمهاد لتقليل التبخر، مراقبة العطش اليومية للنباتات",
  },
  {
    id: 17,
    seasonId: 3,
    orderInYear: 17,
    nameAr: "الهقعة",
    startMonth: 7, startDay: 3,
    durationDays: 13,
    weatherDescription: "حر شديد ورطوبة عالية في المناطق الساحلية، جفاف قاسٍ في المناطق الداخلية، غيوم مائية بدون أمطار",
    plantingAdvice: "الحد الأدنى من الزراعة، متابعة المحاصيل الصيفية القائمة، بدء الجني للمحاصيل المبكرة",
    generalAdvice: "مراقبة مكثفة للآفات الحشرية التي تزدهر في الحر الرطب، تهوية البيوت المحمية",
  },
  {
    id: 18,
    seasonId: 3,
    orderInYear: 18,
    nameAr: "الهنعة",
    startMonth: 7, startDay: 16,
    durationDays: 13,
    weatherDescription: "ذروة الحر الصيفي وأعلى درجات الحرارة في العام، حرارة قياسية في المناطق الداخلية",
    plantingAdvice: "تُجنى محاصيل البطيخ والشمام الصيفية، يُجنى الذرة، بدء جني الباذنجان والفلفل",
    generalAdvice: "تخفيف الري في ساعات الذروة (10 ص - 4 م) وتركيزه فجراً وعشاءً، تظليل النباتات الحساسة",
  },
  {
    id: 19,
    seasonId: 3,
    orderInYear: 19,
    nameAr: "الذراع",
    startMonth: 7, startDay: 29,
    durationDays: 13,
    weatherDescription: "حر شديد لكن مع بدء ظهور الغيوم الصيفية في المناطق الجنوبية، بوادر موسم الأمطار الجنوبية",
    plantingAdvice: "تحضير الأرض لزراعة الموسم الثاني، تُزرع بذور الخضروات الخريفية المبكرة في البيوت المحمية",
    generalAdvice: "جني محاصيل الصيف وتخزين البذور، تنظيف الحقول من بقايا المحاصيل",
  },
  {
    id: 20,
    seasonId: 3,
    orderInYear: 20,
    nameAr: "النثرة",
    startMonth: 8, startDay: 11,
    durationDays: 13,
    weatherDescription: "بدء انكسار الحر التدريجي، قد تهطل أمطار موسمية في المنطقة الجنوبية، طقس أكثر اعتدالاً من ذروة الصيف",
    plantingAdvice: "بدء زراعة الموسم الثاني من الخضروات كالطماطم والخيار والكوسا، اغتنام أمطار الموسم",
    generalAdvice: "استغلال أمطار الموسم في تخزين المياه، تحضير التربة الخريفية",
  },
  {
    id: 21,
    seasonId: 3,
    orderInYear: 21,
    nameAr: "الطرف",
    startMonth: 8, startDay: 24,
    durationDays: 13,
    weatherDescription: "تخفيف الحر التدريجي الواضح، انعش الجو نسبياً، نهاية الصيف الحارقة ومؤشرات على قدوم الخريف",
    plantingAdvice: "تُزرع بذور الخضروات الشتوية مبكراً (السبانخ، الجرجير، الخس)، تُغرس مشاتل الأشجار الخريفية",
    generalAdvice: "تحضير الأراضي للموسم الشتوي، إضافة السماد العضوي للتربة قبل الخريف",
  },

  // ══════════════════════════ الخريف ══════════════════════════
  {
    id: 22,
    seasonId: 4,
    orderInYear: 22,
    nameAr: "الجبهة",
    startMonth: 9, startDay: 6,
    durationDays: 13,
    weatherDescription: "اعتدال تدريجي واضح، نهارات دافئة وليالٍ منعشة، بداية التحول الخريفي في الجو",
    plantingAdvice: "تُزرع الخضروات الخريفية كالجزر والبنجر والملفوف، تُبدأ مشاتل الأشجار المثمرة",
    generalAdvice: "تسميد خريفي شامل، مراجعة منظومة الري وضبطها للحاجة الخريفية",
  },
  {
    id: 23,
    seasonId: 4,
    orderInYear: 23,
    nameAr: "الزبرة",
    startMonth: 9, startDay: 19,
    durationDays: 13,
    weatherDescription: "طقس خريفي معتدل بهيج، رياح شمالية منعشة، أفضل أوقات الخريف للعمل الزراعي",
    plantingAdvice: "تُزرع معظم الخضروات الشتوية مبكراً، تُغرس الأشجار المثمرة، تُغرس شتلات الفراولة",
    generalAdvice: "موسم الغرس الخريفي الرئيسي، استغلال انتعاش الجو للعمليات الزراعية المكثفة",
  },
  {
    id: 24,
    seasonId: 4,
    orderInYear: 24,
    nameAr: "الصرفة",
    startMonth: 10, startDay: 2,
    durationDays: 13,
    weatherDescription: "اعتدال واضح، بداية انخفاض الحرارة الليلية، أمطار خريفية متوقعة في بعض المناطق",
    plantingAdvice: "تُزرع المحاصيل الشتوية الرئيسية كالقمح والشعير في المناطق الشمالية، تُزرع محاصيل التقوية الشتوية",
    generalAdvice: "تقليم الأشجار الصيفية وتشكيلها، إزالة بقايا المحاصيل الصيفية وتسميد الأرض",
  },
  {
    id: 25,
    seasonId: 4,
    orderInYear: 25,
    nameAr: "العواء",
    startMonth: 10, startDay: 15,
    durationDays: 13,
    weatherDescription: "طقس خريفي معتدل، أمطار خريفية محتملة، الجو المثالي للزراعة في معظم مناطق المملكة",
    plantingAdvice: "تُزرع الفراولة والثوم والبصل الشتوي، تُغرس شتلات الخضروات الشتوية، تُزرع نباتات التوابل الشتوية",
    generalAdvice: "تحضير التربة الزراعية بإضافة السماد العضوي (الكمبوست)، توزيع الأسمدة المتوازنة",
  },
  {
    id: 26,
    seasonId: 4,
    orderInYear: 26,
    nameAr: "السماك",
    startMonth: 10, startDay: 28,
    durationDays: 13,
    weatherDescription: "بدء انخفاض واضح في الحرارة الليلية، ليالٍ باردة، أمطار خريفية في المناطق الغربية والجنوبية",
    plantingAdvice: "تُزرع المحاصيل الشتوية، تُزرع بذور الحبوب والبقوليات الشتوية، تُزرع شتلات الخضروات الورقية",
    generalAdvice: "حصاد محاصيل الخريف وتخزينها، تحضير مخازن الإنتاج الشتوي",
  },
  {
    id: 27,
    seasonId: 4,
    orderInYear: 27,
    nameAr: "الغفر",
    startMonth: 11, startDay: 10,
    durationDays: 13,
    weatherDescription: "برد خريفي واضح، أمطار متقطعة في بعض المناطق، الجو يصبح باردًا خاصة ليلاً",
    plantingAdvice: "تُغرس الأشجار المثمرة المتساقطة الأوراق في سبات شتوي، تُزرع الخضروات الشتوية الباردة",
    generalAdvice: "تجهيز الحقول النهائي للزراعة الشتوية، إضافة السماد الكيماوي المتوازن",
  },
  {
    id: 28,
    seasonId: 4,
    orderInYear: 28,
    nameAr: "الزبانى",
    startMonth: 11, startDay: 23,
    durationDays: 13,
    weatherDescription: "برد يبدأ بالاشتداد، رياح شمالية باردة، بداية الاقتراب من الشتاء الحقيقي",
    plantingAdvice: "آخر موعد لزراعة بعض الخضروات الشتوية مثل الجزر والبنجر، تحضير التربة للفصل القادم",
    generalAdvice: "حماية النباتات الحساسة بالتغطية، تقليل الري تدريجياً مع تراجع الحرارة وزيادة تكراره بتوزيع المياه",
  },
];

async function main() {
  console.log("🌟 Seeding Agricultural Star Calendar...");

  const existingSeasons = await prisma.season.count();
  if (existingSeasons > 0) {
    console.log(`⏭  Seasons already seeded (${existingSeasons}) — skipping.`);
    return;
  }

  // إنشاء الفصول
  for (const s of SEASONS) {
    await prisma.season.create({ data: s });
  }
  console.log(`✅ Created ${SEASONS.length} seasons.`);

  // إنشاء الأنواء
  for (const star of STARS) {
    await prisma.agriculturalStar.create({ data: star });
  }
  console.log(`✅ Created ${STARS.length} agricultural stars (أنواء).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
