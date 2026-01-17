import MWLSearch from "../components/MWLSearch.jsx";
export default function MWLPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      {/* Page header */}
      <h1 className="text-2xl font-semibold mb-4">MWL</h1>

      {/* Content card */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow p-6">
        <MWLSearch/>
      </div>
    </div>
  );
}
