import { useLocation } from "react-router-dom";

export default function Background() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";
  const loginBg = "/curalink-login-bg.svg";
  const mobLoginBg = "/mobileLoginBg.svg";
  const tabletLoginBg = "/tabletLoginImage.svg";
  const defaultBg = "/bg2.png";
  return (
    <div className="fixed inset-0 -z-50">
      {/* background image */}
      <div
        className="absolute inset-0 bg-cover bg-center hidden lg:block"
        style={{ backgroundImage: `url(${hideNavbar ? loginBg : defaultBg})` }}
      />
       <div
        className="absolute inset-0 bg-cover  bg-[center_top] block md:hidden"
        style={{ backgroundImage: `url(${hideNavbar ? mobLoginBg : defaultBg})` }}
      />
      <div
        className="absolute inset-0 bg-cover  bg-[center_top] hidden md:block lg:hidden"
        style={{ backgroundImage: `url(${hideNavbar ? tabletLoginBg : defaultBg})` }}
      />

      {/* white blur overlay */}
{/* //       {!hideNavbar && <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />} */}
    </div>
  );
}
