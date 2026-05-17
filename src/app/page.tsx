import { prisma } from "@/lib/prisma";
import PlantCard from "@/components/PlantCard";

const DEV_USER_ID = "dev-user-001";

async function getGardens() {
  return prisma.garden.findMany({
    where: { userId: DEV_USER_ID },
    include: {
      plants: {
        include: {
          catalog:   true,
          schedules: {
            where:   { type: "WATERING", isActive: true },
            orderBy: { nextDueAt: "asc" },
            take:    1,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

const climateLabel: Record<string, string> = {
  HOT_ARID:      "حار جاف",
  MEDITERRANEAN: "متوسطي",
  TROPICAL:      "استوائي",
  TEMPERATE:     "معتدل",
};

export default async function DashboardPage() {
  const gardens = await getGardens();

  const totalPlants  = gardens.reduce((s, g) => s + g.plants.length, 0);
  const healthyCount = gardens.flatMap(g => g.plants).filter(p => p.healthStatus === "HEALTHY").length;
  const alertCount   = totalPlants - healthyCount;

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#1E1E1E]/90 backdrop-blur border-b border-[#313131]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-bold text-[#C5A059] tracking-wide">غَرْس</span>
          <span className="text-xs text-[#6B6560]">حديقتك الذكية</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats bar ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={totalPlants}  label="نبتة"        accent="gold" />
          <StatCard value={healthyCount} label="بصحة جيدة"   accent="green" />
          <StatCard value={alertCount}   label="تحتاج عناية" accent={alertCount > 0 ? "red" : "muted"} />
        </div>

        {/* ── Empty state ─────────────────────────────────────── */}
        {gardens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-5xl">🌱</span>
            <p className="text-[#A89F96] text-sm">لا توجد حدائق بعد</p>
            <p className="text-[#6B6560] text-xs">أضف حديقتك الأولى للبدء</p>
          </div>
        )}

        {/* ── Gardens ─────────────────────────────────────────── */}
        {gardens.map(garden => (
          <section key={garden.id} className="space-y-4">
            {/* garden header */}
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-[#F0EBE3]">{garden.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#272727] text-[#A89F96] border border-[#313131]">
                {climateLabel[garden.climate] ?? garden.climate}
              </span>
              <span className="text-xs text-[#6B6560] mr-auto">
                {garden.plants.length} نبتة
              </span>
            </div>

            {/* plants grid */}
            {garden.plants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#313131] py-10 text-center">
                <p className="text-xs text-[#6B6560]">لا توجد نباتات في هذه الحديقة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {garden.plants.map(plant => (
                  <PlantCard
                    key={plant.id}
                    plantId={plant.id}
                    gardenId={garden.id}
                    nickname={plant.nickname}
                    catalogName={plant.catalog.nameAr}
                    category={plant.catalog.category as any}
                    healthStatus={plant.healthStatus as any}
                    location={plant.location as any}
                    nextWatering={plant.schedules[0]?.nextDueAt ?? null}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

      </main>
    </div>
  );
}

/* ── small helper component ───────────────────────────────────── */
function StatCard({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: "gold" | "green" | "red" | "muted";
}) {
  const colors = {
    gold:  "text-[#C5A059]",
    green: "text-[#6DBF8A]",
    red:   "text-[#E84545]",
    muted: "text-[#A89F96]",
  };
  return (
    <div className="rounded-2xl bg-[#272727] border border-[#313131] px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="text-xs text-[#A89F96] mt-0.5">{label}</p>
    </div>
  );
}
