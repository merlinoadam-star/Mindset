import { NavLink, Outlet } from "react-router-dom";
import { Home, CheckSquare, Dumbbell, Brain, Award } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/habits", label: "Habits", icon: CheckSquare },
  { to: "/practice", label: "Practice", icon: Dumbbell },
  { to: "/mindset", label: "Mindset", icon: Brain },
  { to: "/badges", label: "Badges", icon: Award },
];

export default function Layout() {
  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-xl mx-auto px-4 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto px-3 pb-2">
          <div className="glass rounded-2xl shadow-elevated border border-white/60 dark:border-slate-800 dark:bg-slate-900/90 grid grid-cols-5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-3 text-[10px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-brand-500"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1.5 rounded-xl transition-all duration-200 ${
                        isActive ? "bg-brand-50 dark:bg-brand-950" : ""
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
