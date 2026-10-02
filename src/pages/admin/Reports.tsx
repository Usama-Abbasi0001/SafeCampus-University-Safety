import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Incident } from "../../types";

const COLORS = ["#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#10B981"];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
      <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Reports() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading reports...</div>;

  if (incidents.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-slate-400">
        <span className="text-4xl mb-4">📊</span>
        <h2 className="text-lg font-semibold text-white mb-1">No Data Available</h2>
        <p className="text-sm">There are currently no incidents to generate reports.</p>
      </div>
    );
  }

  // Calculate actual stats from incidents
  const typeCount = incidents.reduce((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byType = Object.entries(typeCount).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  const locCount = incidents.reduce((acc, inc) => {
    acc[inc.location] = (acc[inc.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byLocation = Object.entries(locCount).map(([location, count]) => ({ location, incidents: count }));

  const statusCount = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byStatus = Object.entries(statusCount).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  const mostCommonType = byType.sort((a, b) => b.value - a.value)[0]?.name || "N/A";
  const hotspotLocation = byLocation.sort((a, b) => b.incidents - a.incidents)[0]?.location || "N/A";
  const resolvedCount = statusCount["Resolved"] || 0;
  const resolutionRate = incidents.length > 0 ? Math.round((resolvedCount / incidents.length) * 100) + "%" : "N/A";

  const summaryStats = [
    { label: "Total Incidents", value: incidents.length, delta: "All time", up: false },
    { label: "Most Common Type", value: mostCommonType, delta: "Highest frequency", up: false },
    { label: "Hotspot Location", value: hotspotLocation, delta: "Most reported area", up: false },
    { label: "Resolution Rate", value: resolutionRate, delta: "Resolved incidents", up: true },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className={`text-xs font-medium mt-1 ${s.up ? "text-green-400" : "text-slate-500"}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-5">


        <ChartCard title="Incidents by Harassment Type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                {byType.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#94a3b8" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc" }} itemStyle={{ color: "#f8fafc" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Location">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLocation} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc" }} itemStyle={{ color: "#f8fafc" }} />
              <Bar dataKey="incidents" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incident Status Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} stroke="none">
                {byStatus.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc" }} itemStyle={{ color: "#f8fafc" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Export section */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Export Reports</h3>
          <p className="text-xs text-slate-400 mt-0.5">Download incident data in various formats</p>
        </div>
        <div className="flex gap-3">
          <button className="ripple-wrapper px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors">
            📄 Export PDF
          </button>
          <button className="ripple-wrapper px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors">
            📊 Export CSV
          </button>
          <button className="ripple-wrapper px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
}
