import { NavLink } from "react-router-dom";

const navItems = [
  {name: "Patients", path: "/patients", iconClass: "fa-solid fa-hospital-user"},
  { name: "Studies", path: "/studies", iconClass: "fa-solid fa-book-open-reader"},
  // { name: "MWL", path: "/mwl", iconClass: "fa-solid fa-user-check" },
  // { name: "MPPS", path: "/mpps", iconClass: "fa-solid fa-hospital-user" },
  // { name: "Work Items", path: "/work-items", iconClass: "fa-solid fa-hospital-user" },
  // { name: "Compare", path: "/compare", iconClass: "fa-solid fa-hospital-user" },
  { name: "Dashboard", path: "/dashboard", iconClass: "fa-solid fa-table-columns" },
];

export default function Navbar() {
  return (
    <div className="sticky pb-5 flex flex-col justify-between items-center top-0 z-50 w-[max-content] rounded-r-lg h-screen bg-white/70 backdrop-blur-md border-b bg-[linear-gradient(-90deg,#FFFFFF_0%,#D9E4EF_90%)]">
      <div className=" flex flex-col  px-10 gap-4">
{/*         <button className="text-xl">☰</button> */}
        <img src="/logoSide.png" alt="Logo" className="w-52 mx-auto mb-4 mt-8" />
        <div className="flex flex-col gap-8 mt-10">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-1 rounded-md text-[20px]  ${
                isActive
                  ? "bg-[#14A3B8] text-white font-semibold hover:text-white hover:bg-[#07626f]"
                  : "text-[#14A3B8] hover:text-[#07626f]"
              }`
            }
          >
            <i className={`${item.iconClass} mr-7 text-[16px]`}></i>
            {item.name}
                      
          </NavLink>
        ))}
          </div>
      </div>

 
     <div className="flex flex-col items-start">
         <button 
              className=" text-lg px-4 py-2 rounded-lg transition bg-transparent focus:outline-0 border-none hover:text-[#14A3B8]"
             > 
      
      <i class="fa-regular fa-user  mr-3"></i>
      User
</button>

        <button 
        
              onClick={() => logout() || navigate('/login')} 
              className="text-lg px-4 py-2 rounded-lg transition bg-transparent focus:outline-0 border-none hover:text-[#14A3B8]"
             > 
              <i class="fa-solid fa-arrow-right-from-bracket mr-3"></i>
             Logout 
         </button> 
         </div>
    </div>
  );
}
