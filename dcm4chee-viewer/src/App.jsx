import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// function MWLPage() {
//   return <div className="min-h-screen bg-green-500 text-white p-6">MWL Page</div>;
// }
import MWLPage from "./pages/mwl.jsx";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/mwl" />} />
        <Route path="/mwl" element={<MWLPage />} />
      </Routes>
    </Router>
  );
}
