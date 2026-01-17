import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Patients", path: "/patients" },
  { name: "Studies", path: "/studies" },
  { name: "MWL", path: "/mwl" },
  { name: "MPPS", path: "/mpps" },
  { name: "Work Items", path: "/work-items" },
  { name: "Compare", path: "/compare" },
];

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
      <div className="h-14 w-full flex items-center px-6 gap-4">
        <button className="text-xl">☰</button>

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-1 rounded-md text-sm ${
                isActive
                  ? "bg-slate-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
