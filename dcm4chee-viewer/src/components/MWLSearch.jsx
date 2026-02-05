
import { useState } from "react";
import { searchMWL } from "../services/dcmchee"; 

export default function MWLSearchBox() {
  // ============================================================================
  // STATE
  // ============================================================================
  const [formData, setFormData] = useState({
    patientFamilyName: "",
    patientId: "",
    admissionId: "",
    accessionNumber: "",
    issuerOfPatient: "",
    modality: "",
    scheduledStationAET: "",
    spsStartTime: "",
    studyInstanceUID: "",
    spsStatus: "",
    webAppService: "",
  });

  const [loading, setLoading] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const results = await searchMWL(formData);

      console.log("✅ MWL Results:", results);
      alert(`Found ${results.length} MWL items`);

    } catch (error) {
      console.error("❌ MWL Search Error:", error);
      alert("Search failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UI
  // ============================================================================
  return (
    <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">
      
      {/* Header */}
      <div className="flex gap-2 px-6 py-3 border-b">
        <img
          src="/logo-icon.png"
          width={50}
          height={50}
          alt="icon"
          className="inline-block"
        />
        <h2 className="text-2xl mt-2 font-semibold">MWL</h2>
      </div>

      {/* Fields */}
      <div className="bg-white/50 rounded-xl p-6 mx-auto">
        <div className="grid grid-cols-4 gap-4 text-sm">

          {/* Patient Family Name */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Patient Family Name
            </label>
            <input
              name="patientFamilyName"
              value={formData.patientFamilyName}
              onChange={handleChange}
              placeholder="Patient family name"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Patient ID */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Patient ID
            </label>
            <input
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              placeholder="Patient ID"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Admission ID */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Admission ID
            </label>
            <input
              name="admissionId"
              value={formData.admissionId}
              onChange={handleChange}
              placeholder="Admission ID"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* SPS Status */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              SPS Status
            </label>
            <select
              name="spsStatus"
              value={formData.spsStatus}
              onChange={handleChange}
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            >
              <option value="">All</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARRIVED">Arrived</option>
              <option value="READY">Ready</option>
              <option value="STARTED">Started</option>
              <option value="COMPLETED">Completed</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>

          {/* Accession Number */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Accession Number
            </label>
            <input
              name="accessionNumber"
              value={formData.accessionNumber}
              onChange={handleChange}
              placeholder="Accession Number"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Issuer of Patient */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Issuer of Patient
            </label>
            <input
              name="issuerOfPatient"
              value={formData.issuerOfPatient}
              onChange={handleChange}
              placeholder="Issuer of Patient"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Scheduled Station AE Title */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Scheduled Station AE Title
            </label>
            <input
              name="scheduledStationAET"
              value={formData.scheduledStationAET}
              onChange={handleChange}
              placeholder="Station AE Title"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Modality */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Modality
            </label>
            <select
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            >
              <option value="">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MR">MR</option>
              <option value="US">US</option>
              <option value="XA">XA</option>
              <option value="CR">CR</option>
              <option value="DX">DX</option>
              <option value="NM">NM</option>
              <option value="PT">PT</option>
            </select>
          </div>

          {/* SPS Start Time */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              SPS Start Time
            </label>
            <input
              type="time"
              name="spsStartTime"
              value={formData.spsStartTime}
              onChange={handleChange}
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

          {/* Study Instance UID */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Study Instance UID
            </label>
            <input
              name="studyInstanceUID"
              value={formData.studyInstanceUID}
              onChange={handleChange}
              placeholder="Study Instance UID"
              className="input w-full px-4 py-2 border rounded-2xl bg-[#00768317]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-end justify-between mt-6">

          {/* Web App Service */}
          <div>
            <label className="block text-lg text-slate-600 mb-2">
              Web App Service
            </label>
            <select
              name="webAppService"
              value={formData.webAppService}
              onChange={handleChange}
              className="input w-52 px-4 py-2 border rounded-2xl bg-[#00768317]"
            >
              <option value="">Web App Service</option>
              <option value="DCM4CHEE">DCM4CHEE</option>
            </select>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 text-white rounded-2xl bg-[#0a6e79] hover:bg-[#05383d] transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "SUBMIT"}
          </button>

        </div>
      </div>
    </div>
  );
}
