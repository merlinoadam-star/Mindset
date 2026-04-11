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
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="max-w-xl mx-auto px-4 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-xl mx-auto grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 text-xs font-medium transition ${
                  isActive
                    ? "text-brand-600"
                    : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              <Icon size={22} strokeWidth={2.25} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
