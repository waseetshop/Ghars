type HealthStatus = "HEALTHY" | "STRESSED" | "DISEASED" | "RECOVERING" | "CRITICAL";

const config: Record<HealthStatus, { label: string; color: string; dot: string }> = {
  HEALTHY:    { label: "بصحة جيدة",  color: "text-[#6DBF8A]", dot: "bg-[#6DBF8A]" },
  STRESSED:   { label: "متوتر",      color: "text-[#D9A35A]", dot: "bg-[#D9A35A]" },
  DISEASED:   { label: "مريض",       color: "text-[#C96B6B]", dot: "bg-[#C96B6B]" },
  RECOVERING: { label: "في التعافي", color: "text-[#C5A059]", dot: "bg-[#C5A059]" },
  CRITICAL:   { label: "حرج",        color: "text-[#E84545]", dot: "bg-[#E84545] animate-pulse" },
};

export default function HealthBadge({ status }: { status: HealthStatus }) {
  const c = config[status] ?? config.HEALTHY;
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
