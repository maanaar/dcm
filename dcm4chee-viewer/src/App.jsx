import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// function MWLPage() {
//   return <div className="min-h-screen bg-green-500 text-white p-6">MWL Page</div>;
// }
import MWLPage from "./pages/mwl.jsx";
import PatientsPage from "./pages/PatientPage.jsx";
import Background from "./components/background.jsx";
import Navbar from "./components/navbar.jsx";
import StudiesPage from "./pages/studies.jsx";
import LoginPage from "./pages/LoginPage.jsx";

export default function App() {
  return (
    <Router>
      <div className="relative flex flex-col w-full min-h-screen">
        <Background />

        <div className="relative z-10 flex flex-col w-full flex-1">
          
          <Navbar />

          <main className="w-full flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/mwl" />} />
              <Route path="/mwl" element={<MWLPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/studies" element={<StudiesPage/>} />
              <Route path="/login" element={<LoginPage/>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}


