import { Notification } from "../../types";

export default function ParentNotifications({ user }: { user: any }) {
  const parentNotifications: Notification[] = []; // Empty for now
  const typeConfig = {
    alert:   { icon: "🚨", bg: "bg-red-50",   border: "border-red-100",   title: "text-red-800",   body: "text-red-700"   },
    warning: { icon: "⚠️", bg: "bg-amber-50", border: "border-amber-100", title: "text-amber-800", body: "text-amber-700" },
    info:    { icon: "ℹ️", bg: "bg-blue-50",  border: "border-blue-100",  title: "text-blue-800",  body: "text-blue-700"  },
    success: { icon: "✅", bg: "bg-green-50", border: "border-green-100", title: "text-green-800", body: "text-green-700" },
  };

  return (
    <div className="p-6 space-y-3 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{parentNotifications.filter((n) => !n.read).length} unread notifications</span>
        <button className="text-xs text-blue-600 font-medium hover:underline">Mark all as read</button>
      </div>

      {parentNotifications.map((n) => {
        const c = typeConfig[n.type];
        return (
          <div key={n.id} className={`rounded-xl border ${c.bg} ${c.border} p-4 ${!n.read ? "ring-1 ring-inset ring-red-200" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{c.icon}</span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${c.title}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />}
                </div>
                <p className={`text-sm mt-1 ${c.body}`}>{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{n.time}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
