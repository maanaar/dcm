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

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const logout = () => {
    const authMode = localStorage.getItem('authMode');
    
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    
    // Optionally clear remembered credentials
    // Uncomment these lines if you want to clear "Remember Me" on logout
    // localStorage.removeItem('rememberedEmail');
    // localStorage.removeItem('rememberedPassword');
    
    console.log(`Logged out from ${authMode} mode`);
    
    // Navigate to login page
    navigate('/login');
  };

  const getUserEmail = () => {
    return localStorage.getItem('userEmail') || 'User';
  };

  const getAuthMode = () => {
    const mode = localStorage.getItem('authMode');
    return mode === 'keycloak' ? 'Keycloak' : 'Demo';
  };

  return (
    <div className="sticky flex flex-col top-0 z-50 w-full lg:w-[280px] rounded-r-lg h-auto lg:h-screen bg-white/70 backdrop-blur-md border-b lg:border-r bg-[linear-gradient(-90deg,#FFFFFF_0%,#D9E4EF_90%)]">
      <div className="flex flex-col px-5 lg:px-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center py-4 lg:py-6">
          <img src="/logoSide.png" alt="Logo" className="w-40 lg:w-48 lg:mx-auto" />
          <div className="   items-start text-black flex flex-col md:flex-row lg:hidden ">
        <div className="text-sm lg:px-4 py-2 text-gray-600">
          <div>{getUserEmail()}</div>
          <div className="text-xs text-gray-500">({getAuthMode()} mode)</div>
        </div>
        <button 
          onClick={logout}
          className="text-lg px-4 py-2 rounded-lg transition bg-transparent focus:outline-0 border-none hover:text-[#14A3B8]"
        > 
          <i className="fa-solid fa-arrow-right-from-bracket mr-3"></i>
          Logout 
        </button> 
      </div>
          </div>
        <div className="flex flex-wrap justify-center lg:flex-col gap-3 lg:gap-4 pb-4">
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
 
      <div className="mt-auto border-t border-gray-200/50 pt-4 pb-4 px-5 lg:px-6 hidden lg:flex flex-col gap-2">
        <div className="text-sm px-3 py-2 bg-white/40 rounded-lg">
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
  );
}