import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
const reportData = {
  daily: [],
  monthly: [],
  byType: [],
  byLocation: [],
  weekly: [],
  byStatus: []
};

const COLORS = ["#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#10B981"];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Reports() {
  const summaryStats = [
    { label: "Total This Month", value: 10, delta: "-26% vs last month", up: false },
    { label: "Most Common Type", value: "Verbal", delta: "38% of all incidents", up: false },
    { label: "Hotspot Location", value: "CS Block", delta: "24 incidents total", up: false },
    { label: "Resolution Rate", value: "65%", delta: "+8% improvement", up: true },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className={`text-xs font-medium mt-1 ${s.up ? "text-green-600" : "text-gray-400"}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Daily Incidents — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reportData.daily} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="incidents" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Incident Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={reportData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              <Line type="monotone" dataKey="incidents" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: "#6366F1", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Harassment Type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={reportData.byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {reportData.byType.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Location">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData.byLocation} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="incidents" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Incidents">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reportData.weekly} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="incidents" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incident Status Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={reportData.byStatus} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {reportData.byStatus.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Export section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Export Reports</h3>
          <p className="text-xs text-gray-500 mt-0.5">Download incident data in various formats</p>
        </div>
        <div className="flex gap-3">
          <button className="ripple-wrapper px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg font-medium transition-colors">
            📄 Export PDF
          </button>
          <button className="ripple-wrapper px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg font-medium transition-colors">
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
