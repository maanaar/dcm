import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/navbar.jsx";
import Background from "./components/background.jsx";

// Lazy load all pages
const MWLPage = lazy(() => import("./pages/mwl.jsx"));
const PatientsPage = lazy(() => import("./pages/PatientPage.jsx"));
const StudiesPage = lazy(() => import("./pages/studies.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DCMDashboard.jsx"));
const SingleHospitalPage = lazy(() => import("./components/singleHospital.jsx"));
const AppEntitiesList = lazy(() => import("./pages/AppEntitiesList.jsx"));
const SeriesPage = lazy(() => import("./pages/SeriesPage.jsx"));
const DevicesPage = lazy(() => import("./pages/DevicesPage.jsx"));
const AEListPage = lazy(() => import("./pages/AEListPage.jsx"));
const HL7ApplicationPage = lazy(() => import("./pages/HL7ApplicationPage.jsx"));
const RoutingRolesPage = lazy(() => import("./pages/RoutingRolesPage.jsx"));
const TransformRulesPage = lazy(() => import("./pages/TransformRulesPage.jsx"));
const ExportRulesPage = lazy(() => import("./pages/ExportRulesPage.jsx"));
const UsersPage = lazy(() => import("./pages/UsersPage.jsx"));

// Admin-only route guard
const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#14A3B8]"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);
function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <div className="relative flex flex-col w-full min-h-screen">
    <Background />

      <div className="relative z-10 flex  w-full flex-1 flex-col lg:flex-row">
        {!hideNavbar && <Navbar />}

        <main className="w-full flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardPage/>} />
              <Route path="/hospital/:id" element={<SingleHospitalPage />} />
              <Route path="/app-entities" element={<AppEntitiesList />} />

              {/* Navigation Routes */}
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/studies" element={<StudiesPage />} />
              <Route path="/series" element={<SeriesPage />} />

              {/* Configuration Routes */}
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/ae-list" element={<AEListPage />} />
              <Route path="/hl7-application" element={<HL7ApplicationPage />} />
              <Route path="/routing-roles" element={<RoutingRolesPage />} />
              <Route path="/transform-rules" element={<TransformRulesPage />} />
              <Route path="/export-rules" element={<ExportRulesPage />} />

              {/* Administration Routes */}
              <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />

              {/* Other Routes */}
              <Route path="/mwl" element={<MWLPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}