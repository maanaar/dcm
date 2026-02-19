import { useState } from 'react';
import { searchStudies } from '../services/dcmchee';


export default function StudiesBox() {
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    accessionNumber: '',
    fuzzyMatching: false,
    issuerOfPatient: '',
    issuerOfAccessionNumber: '',
    studyDescription: '',
    modality: 'all',
    referringPhysician: '',
    institutionalDepartment: '',
    sendingAET: '',
    studyDate: '',
    studyTime: '',
    studyReceived: '',
    studyAccess: '',
    orderBy: '',
    webAppService: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setIsSearching(true);

    try {
      const results = await searchStudies(formData);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching studies. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-white/80 backdrop-blur-md border shadow">
        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <span className="text-2xl text-[rgb(215,160,56)]">✴</span>
          <h2 className="text-2xl font-semibold">Studies</h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <Input
              label="Patient family name"
              name="patientFamilyName"
              value={formData.patientFamilyName}
              onChange={handleInputChange}
            />
            <Input
              label="Patient ID"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
            />
            <Input
              label="Accession number"
              name="accessionNumber"
              value={formData.accessionNumber}
              onChange={handleInputChange}
            />
            <Checkbox
              label="Fuzzy Matching"
              name="fuzzyMatching"
              checked={formData.fuzzyMatching}
              onChange={handleInputChange}
            />
            <Input
              label="Issuer of patient"
              name="issuerOfPatient"
              value={formData.issuerOfPatient}
              onChange={handleInputChange}
            />
            <Input
              label="Issuer of accession number"
              name="issuerOfAccessionNumber"
              value={formData.issuerOfAccessionNumber}
              onChange={handleInputChange}
            />
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <Input
              label="Study Description"
              name="studyDescription"
              value={formData.studyDescription}
              onChange={handleInputChange}
            />
            <Select
              label="Modality"
              name="modality"
              value={formData.modality}
              onChange={handleInputChange}
            />
            <Input
              label="Referring physician family"
              name="referringPhysician"
              value={formData.referringPhysician}
              onChange={handleInputChange}
            />
            <Input
              label="Institutional Department Name"
              name="institutionalDepartment"
              value={formData.institutionalDepartment}
              onChange={handleInputChange}
            />
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <Input
              label="Sending AET of Series"
              name="sendingAET"
              value={formData.sendingAET}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study date"
              name="studyDate"
              value={formData.studyDate}
              onChange={handleInputChange}
            />
            <TimeInput
              label="Study time"
              name="studyTime"
              value={formData.studyTime}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study Received"
              name="studyReceived"
              value={formData.studyReceived}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study Access"
              name="studyAccess"
              value={formData.studyAccess}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-6 py-4 border-t">
          <select
            name="orderBy"
            value={formData.orderBy}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="">Order By</option>
            <option value="StudyDate">Study Date</option>
            <option value="PatientName">Patient Name</option>
            <option value="Modality">Modality</option>
          </select>
          <select
            name="webAppService"
            value={formData.webAppService}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="">Web App Service</option>
            <option value="dcm4chee-arc">DCM4CHEE Archive</option>
            <option value="pacs-service">PACS Service</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={isSearching}
            className="ml-auto bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSearching ? 'SEARCHING...' : 'SUBMIT'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border shadow">
          <div className="px-6 py-3 border-b bg-slate-50">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length} studies found)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Study Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Study Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Modality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Accession #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Series</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Instances</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((study, index) => (
                  <tr
                    key={study.id}
                    className={`border-b hover:bg-slate-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">{study.patientName}</td>
                    <td className="px-4 py-3 text-sm font-mono">{study.patientId}</td>
                    <td className="px-4 py-3 text-sm">{study.studyDate}</td>
                    <td className="px-4 py-3 text-sm">{study.studyTime}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{study.studyDescription}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {study.accessionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{study.numberOfSeries}</td>
                    <td className="px-4 py-3 text-sm text-center">{study.numberOfInstances}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && !isSearching && (
        <div className="bg-white/80 backdrop-blur-md border shadow p-12 text-center text-slate-500">
          <p className="text-lg">No studies found. Use the search form above to find studies.</p>
        </div>
      )}
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function DateInput({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function TimeInput({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="time"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function Select({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      >
        <option value="all">All</option>
        <option value="CT">CT</option>
        <option value="MR">MR</option>
        <option value="US">US</option>
        <option value="CR">CR (X-Ray)</option>
        <option value="PT">PT (PET)</option>
        <option value="MG">MG (Mammography)</option>
        <option value="NM">NM (Nuclear Medicine)</option>
      </select>
    </label>
  );
}

function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="cursor-pointer"
      />
      {label}
    </label>
  );
}