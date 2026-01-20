import { useLocation } from "react-router-dom";

export default function Background() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";
  return (
    <div className="fixed inset-0 -z-50">
      {/* background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpeg')" }}
      />

      {/* white blur overlay */}
      {!hideNavbar && <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />}
    </div>
  );
}
