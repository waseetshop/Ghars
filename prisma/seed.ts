import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATALOG = [
  {
    nameAr: "أفوكادو",
    nameEn: "Avocado",
    nameLatin: "Persea americana",
    category: "FRUIT_TREE" as const,
    lightMin: 20000,
    lightMax: 50000,
    lightDescription: "شمس مباشرة 6+ ساعات — لا يتحمل الظل",
    soilPH_min: 6.0,
    soilPH_max: 6.5,
    drainageRequired: true,
    saltSensitivity: "VERY_HIGH" as const, // احتراق الأطراف عند تراكم الأملاح
    wateringCycleSummer: 3,
    wateringCycleWinter: 7,
  },
  {
    nameAr: "مورينجا",
    nameEn: "Moringa",
    nameLatin: "Moringa oleifera",
    category: "FRUIT_TREE" as const,
    lightMin: 30000,
    lightMax: 80000,
    lightDescription: "شمس كاملة — متحمل للجفاف الشديد",
    soilPH_min: 6.0,
    soilPH_max: 7.0,
    drainageRequired: true,
    saltSensitivity: "LOW" as const,
    wateringCycleSummer: 4,
    wateringCycleWinter: 10,
  },
  {
    nameAr: "طماطم",
    nameEn: "Tomato",
    nameLatin: "Solanum lycopersicum",
    category: "VEGETABLE" as const,
    lightMin: 25000,
    lightMax: 60000,
    lightDescription: "شمس مباشرة 8 ساعات — حرج للإنتاج",
    soilPH_min: 6.0,
    soilPH_max: 6.8,
    drainageRequired: true,
    saltSensitivity: "MEDIUM" as const,
    wateringCycleSummer: 2,
    wateringCycleWinter: 3,
  },
  {
    nameAr: "لبلاب ساحلي",
    nameEn: "Pothos",
    nameLatin: "Epipremnum aureum",
    category: "INDOOR" as const,
    lightMin: 500,
    lightMax: 5000,
    lightDescription: "ضوء غير مباشر — يتحمل الإضاءة المنخفضة",
    soilPH_min: 6.0,
    soilPH_max: 7.0,
    drainageRequired: true,
    saltSensitivity: "LOW" as const,
    wateringCycleSummer: 7,
    wateringCycleWinter: 14,
  },
  {
    nameAr: "ليراتا",
    nameEn: "Fiddle Leaf Fig",
    nameLatin: "Ficus lyrata",
    category: "INDOOR" as const,
    lightMin: 5000,
    lightMax: 20000,
    lightDescription: "ضوء ساطع غير مباشر — يكره التحريك",
    soilPH_min: 6.0,
    soilPH_max: 7.0,
    drainageRequired: true,
    saltSensitivity: "MEDIUM" as const,
    wateringCycleSummer: 7,
    wateringCycleWinter: 14,
  },
  {
    nameAr: "نيم",
    nameEn: "Neem",
    nameLatin: "Azadirachta indica",
    category: "FRUIT_TREE" as const,
    lightMin: 30000,
    lightMax: 80000,
    lightDescription: "شمس كاملة — مقاوم للحرارة الشديدة",
    soilPH_min: 6.2,
    soilPH_max: 7.5,
    drainageRequired: true,
    saltSensitivity: "LOW" as const,
    wateringCycleSummer: 5,
    wateringCycleWinter: 14,
  },
];

async function main() {
  console.log("🌱 Seeding PlantCatalog...");

  const existing = await prisma.plantCatalog.count();
  if (existing > 0) {
    console.log(`⏭  Catalog already has ${existing} entries — skipping.`);
    return;
  }

  const result = await prisma.plantCatalog.createMany({ data: CATALOG });
  console.log(`✅ Created ${result.count} catalog entries.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
