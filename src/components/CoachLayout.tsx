import { NavLink, Outlet } from "react-router-dom";
import { Home, Users, Settings } from "lucide-react";

/**
 * Simpler bottom-nav for coach and parent accounts. They don't need the
 * athlete-centric Habits / Practice / Mindset / Badges tabs.
 */
const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function CoachLayout() {
  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-xl mx-auto px-4 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto px-3 pb-2">
          <div className="glass rounded-2xl shadow-elevated border border-white/60 grid grid-cols-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-3 text-[10px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1.5 rounded-xl transition-all duration-200 ${
                        isActive ? "bg-brand-50" : ""
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="mt-0.5">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
