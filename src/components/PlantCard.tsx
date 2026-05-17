import HealthBadge from "./HealthBadge";

type HealthStatus = "HEALTHY" | "STRESSED" | "DISEASED" | "RECOVERING" | "CRITICAL";
type PlantCategory = "FRUIT_TREE" | "VEGETABLE" | "HERB" | "ORNAMENTAL" | "INDOOR" | "SUCCULENT";
type PlantLocation = "INDOOR" | "OUTDOOR" | "BALCONY" | "GREENHOUSE";

const categoryEmoji: Record<PlantCategory, string> = {
  FRUIT_TREE: "🌳",
  VEGETABLE:  "🥬",
  HERB:       "🌿",
  ORNAMENTAL: "🌺",
  INDOOR:     "🪴",
  SUCCULENT:  "🌵",
};

const locationLabel: Record<PlantLocation, string> = {
  INDOOR:     "داخلي",
  OUTDOOR:    "خارجي",
  BALCONY:    "شرفة",
  GREENHOUSE: "بيت زجاجي",
};

function wateringCountdown(nextDueAt: Date | null): string {
  if (!nextDueAt) return "—";
  const diff = nextDueAt.getTime() - Date.now();
  if (diff < 0) return "متأخر!";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

interface PlantCardProps {
  nickname:     string | null;
  catalogName:  string;
  category:     PlantCategory;
  healthStatus: HealthStatus;
  location:     PlantLocation;
  nextWatering: Date | null;
  plantId:      string;
  gardenId:     string;
}

export default function PlantCard({
  nickname,
  catalogName,
  category,
  healthStatus,
  location,
  nextWatering,
}: PlantCardProps) {
  const displayName = nickname ?? catalogName;
  const isOverdue = nextWatering && nextWatering.getTime() < Date.now();

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl bg-[#272727] border border-[#313131] p-4 transition-all hover:border-[#3D3D3D] hover:shadow-lg group">
      {/* plant icon */}
      <div className="flex items-center justify-between">
        <span className="text-3xl leading-none">{categoryEmoji[category]}</span>
        <HealthBadge status={healthStatus} />
      </div>

      {/* name */}
      <div>
        <h3 className="text-sm font-semibold text-[#F0EBE3] leading-tight">{displayName}</h3>
        {nickname && (
          <p className="text-xs text-[#6B6560] mt-0.5">{catalogName}</p>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#313131]">
        <span className="text-xs text-[#A89F96]">{locationLabel[location]}</span>
        <span className={`text-xs font-medium ${isOverdue ? "text-[#E84545]" : "text-[#C5A059]"}`}>
          💧 {wateringCountdown(nextWatering)}
        </span>
      </div>
    </div>
  );
}
