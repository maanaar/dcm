import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  {name: "Patients", path: "/patients", iconClass: "fa-solid fa-hospital-user"},
  { name: "Studies", path: "/studies", iconClass: "fa-solid fa-book-open-reader"},
  { name: "Dashboard", path: "/dashboard", iconClass: "fa-solid fa-table-columns" },
];

export default function Navbar() {
  const navigate = useNavigate();

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
    <div className="sticky pb-5 flex flex-col lg:justify-between lg:items-center top-0 z-50 w-full lg:w-[max-content] rounded-r-lg lg:h-screen bg-white/70 backdrop-blur-md border-b bg-[linear-gradient(-90deg,#FFFFFF_0%,#D9E4EF_90%)]">
      <div className="flex flex-col px-5 lg:px-10 lg:gap-4">
        <div className="flex justify-between items-center  ">
          <img src="/logoSide.png" alt="Logo" className="w-40 lg:w-52 lg:mx-auto lg:mb-4 lg:mt-8" />
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
        <div className="flex flex-wrap justify-center  lg:flex-col gap-4 lg:gap-8 lg:mt-10">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-1 rounded-md text-[16px] lg:text-[20px] flex justify-center items-center lg:justify-start ${
                  isActive
                    ? "bg-[#14A3B8] text-white font-semibold hover:text-white hover:bg-[#07626f]"
                    : "text-[#14A3B8] hover:text-[#07626f]"
                }`
              }
            >
              <i className={`${item.iconClass} mr-2 lg:mr-7 text-[16px]`}></i>
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
 
      <div className=" lg:justify-between flex-col items-start text-black hidden lg:flex">
        <div className="text-sm px-4 py-2 text-gray-600">
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
  );
}