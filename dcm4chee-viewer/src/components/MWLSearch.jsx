export default function MWLSearchBox() {
  return (
    <div className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-6">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✴</span>
        <h2 className="text-xl font-semibold">MWL</h2>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <input className="input" placeholder="Patient family name" />
        <select className="input">
          <option>Patient ID</option>
        </select>
        <select className="input">
          <option>Admission ID</option>
        </select>
        <select className="input">
          <option>SPS Status</option>
        </select>

        <input className="input col-span-2" placeholder="Accession number" />
        <input className="input" placeholder="Issuer of Patient" />
        <input className="input" placeholder="Scheduled Station AE Title" />

        <select className="input">
          <option>Modality</option>
        </select>
        <input className="input" placeholder="SPS Start Time" />
        <input className="input" placeholder="Study Instance UID" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <select className="input w-48">
          <option>Web App Service</option>
        </select>

        <button className="bg-slate-700 hover:bg-slate-800 text-white px-10 py-3 rounded-full">
          SUBMIT
        </button>
      </div>
    </div>
  );
}
