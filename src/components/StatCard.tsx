import React from "react";

interface Props {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; up?: boolean };
  accent?: string;
}

export default function StatCard({ label, value, icon, iconBg = "bg-blue-500/20 text-blue-400", trend, accent = "text-blue-400" }: Props) {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-700/50 flex flex-col justify-between hover:shadow-lg hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 min-h-[120px] h-full">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 line-clamp-2 leading-tight">{label}</p>
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className={`text-3xl font-bold ${accent}`} style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium ${trend.up ? "text-green-400" : "text-red-400"}`}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 text-lg`}>{icon}</div>
      </div>
    </div>
  );
}
