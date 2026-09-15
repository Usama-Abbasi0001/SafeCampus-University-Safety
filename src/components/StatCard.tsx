import React from "react";

interface Props {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; up?: boolean };
  accent?: string;
}

export default function StatCard({ label, value, icon, iconBg = "bg-blue-100", trend, accent = "text-blue-600" }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px] h-full">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 line-clamp-2 leading-tight">{label}</p>
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className={`text-3xl font-bold ${accent}`} style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium ${trend.up ? "text-green-600" : "text-red-500"}`}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 text-lg`}>{icon}</div>
      </div>
    </div>
  );
}
