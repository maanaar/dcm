import StudiesBox from "../components/studiesBox.jsx";
export default function StudiesPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      {/* Page header */}
      {/* <h1 className="text-3xl font-semibold mb-4 text-[rgb(45,97,135)]">Studies Search</h1> */}

      {/* Content card */}
      {/* <div className="bg-white/80 backdrop-blur-md rounded-xl shadow p-6"> */}
        <StudiesBox/>
      {/* </div> */}
    </div>
  );
}
