import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const navItems = [
  {
    name: "Dashboard",
    iconClass: "fa-solid fa-table-columns",
    children: [
      { name: "Hospitals Dashboard", path: "/dashboard" },
      { name: "App Entities List", path: "/app-entities" },
    ]
  },
  {
    name: "Navigation",
    iconClass: "fa-solid fa-compass",
    children: [
      { name: "Patient", path: "/patients" },
      { name: "Studies", path: "/studies" },
      { name: "Series", path: "/series" },
    ]
  },
  {
    name: "Configuration",
    iconClass: "fa-solid fa-gears",
    children: [
      { name: "Devices", path: "/devices" },
      { name: "AE List", path: "/ae-list" },
      { name: "HL7 Application", path: "/hl7-application" },
      { name: "Routing Roles", path: "/routing-roles" },
    ]
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({
    "Dashboard": true,
    "Navigation": true,
    "Configuration": true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const logout = () => {
    const authMode = localStorage.getItem('authMode');

    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');

    console.log(`Logged out from ${authMode} mode`);

    // Navigate to login page
    navigate('/login');
    closeMobileMenu();
  };

  const getUserEmail = () => {
    return localStorage.getItem('userEmail') || 'User';
  };

  const getAuthMode = () => {
    const mode = localStorage.getItem('authMode');
    return mode === 'keycloak' ? 'Keycloak' : 'Demo';
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 w-full h-16 bg-white/70 backdrop-blur-md border-b bg-[linear-gradient(-90deg,#FFFFFF_0%,#D9E4EF_90%)] flex items-center justify-between px-4">
        <img src="/logoSide.png" alt="Logo" className="h-10" />
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-[#14A3B8] hover:text-[#07626f] transition-colors"
          aria-label="Toggle menu"
        >
          <i className={`fa-solid ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar - Desktop & Mobile Slide-in */}
      <div className={`
        fixed lg:sticky top-0 z-50
        w-[280px] h-screen
        bg-white/70 backdrop-blur-md border-r
        bg-[linear-gradient(-90deg,#FFFFFF_0%,#D9E4EF_90%)]
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Desktop Logo */}
        <div className="hidden lg:flex justify-center items-center py-6 px-6">
          <img src="/logoSide.png" alt="Logo" className="w-48" />
        </div>

        {/* Mobile User Info */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-200/50">
          <div className="text-sm">
            <div className="font-medium text-gray-700">{getUserEmail()}</div>
            <div className="text-xs text-gray-500">({getAuthMode()} mode)</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-4">
          <div className="flex flex-col gap-3 lg:gap-4">
            {navItems.map((item) => (
              <div key={item.name} className="w-full">
                {/* Parent Item */}
                <button
                  onClick={() => toggleExpand(item.name)}
                  className="w-full px-4 py-2.5 rounded-lg text-[15px] lg:text-[16px] flex justify-between items-center text-[#14A3B8] hover:text-[#07626f] hover:bg-white/50 transition-all duration-200 font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <i className={`${item.iconClass} text-[18px]`}></i>
                    <span>{item.name}</span>
                  </div>
                  <i className={`fa-solid fa-chevron-${expandedItems[item.name] ? 'up' : 'down'} text-xs transition-transform duration-200`}></i>
                </button>

                {/* Child Items */}
                {expandedItems[item.name] && (
                  <div className="ml-3 lg:ml-4 mt-1.5 space-y-1 border-l-2 border-[#14A3B8]/20 pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `block px-4 py-2 rounded-lg text-[14px] lg:text-[15px] transition-all duration-200 ${
                            isActive
                              ? "bg-[#14A3B8] text-white font-semibold shadow-sm"
                              : "text-[#14A3B8] hover:bg-white/50 hover:text-[#07626f] font-medium"
                          }`
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="mt-auto border-t border-gray-200/50 pt-4 pb-4 px-5 lg:px-6 flex flex-col gap-2">
          <div className="hidden lg:block text-sm px-3 py-2 bg-white/40 rounded-lg">
            <div className="font-medium text-gray-700">{getUserEmail()}</div>
            <div className="text-xs text-gray-500">({getAuthMode()} mode)</div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 bg-transparent hover:bg-white/50 focus:outline-none text-[#14A3B8] hover:text-[#07626f] font-medium"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-3"></i>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
