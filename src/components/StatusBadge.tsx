import { IncidentStatus, SafetyStatus } from "../types";

interface Props {
  status: IncidentStatus | SafetyStatus | string;
  size?: "sm" | "md";
}

const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  New:                   { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "New" },
  "Under Review":        { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Under Review" },
  Confirmed:             { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Confirmed" },
  Rejected:              { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   label: "Rejected" },
  Resolved:              { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Resolved" },
  Safe:                  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Safe" },
  Alert:                 { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Alert" },
  "Incident Under Review": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500",  label: "Under Review" },
  Active:                { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Active" },
  Inactive:              { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400",   label: "Inactive" },
  Maintenance:           { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Maintenance" },
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
      {c.label}
    </span>
  );
}
