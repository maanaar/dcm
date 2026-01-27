import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStudies } from '../services/dcmchee';

export default function StudiesBox() {
  const navigate = useNavigate();
  
  // Form state - matches all your input fields
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    accessionNumber: '',
    fuzzyMatching: false,
    issuerOfPatient: '',
    issuerOfAccessionNumber: '',
    studyDescription: '',
    modality: '',
    referringPhysician: '',
    institutionalDepartmentName: '',
    sendingAET: '',
    studyDate: '',
    studyTime: '',
    studyReceived: '',
    studyAccess: '',
    orderBy: 'StudyDate',
    webAppService: 'dcm4chee-arc',
    limit: '25'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);

    try {
      // Call the API - you'll need to create this function
      const results = await searchStudies(formData);
      setSearchResults(results);

      if (results.length === 0) {
        setError('No studies found matching your criteria.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to search studies: ${err.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border shadow">
      {/* Header */}
      <div className="flex gap-2 px-6 py-3 border-b">
        <span className="text-2xl text-[rgb(215,160,56)]">✴</span>
        <h2 className="text-2xl font-semibold">Studies</h2>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit}>
        {/* Main Search Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Column 1 - Patient Info */}
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

          {/* Column 2 - Study Info */}
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
              name="institutionalDepartmentName"
              value={formData.institutionalDepartmentName}
              onChange={handleInputChange}
            />
          </div>

          {/* Column 3 - Dates & AET */}
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
            <DateInput
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

        {/* Advanced Filters Toggle */}
        <div className="px-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
          >
            {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
          </button>
        </div>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div className="px-6 pb-6">
            <div className="p-4 bg-slate-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Study Instance UID"
                name="studyInstanceUID"
                value={formData.studyInstanceUID || ''}
                onChange={handleInputChange}
              />
              <Input
                label="Limit"
                name="limit"
                type="number"
                value={formData.limit}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {/* Footer - Controls */}
        <div className="flex items-center gap-4 px-6 py-4 border-t">
          <select
            name="orderBy"
            value={formData.orderBy}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="StudyDate">Study Date</option>
            <option value="-StudyDate">Study Date (Desc)</option>
            <option value="PatientName">Patient Name</option>
            <option value="StudyTime">Study Time</option>
            <option value="AccessionNumber">Accession Number</option>
          </select>

          <select
            name="webAppService"
            value={formData.webAppService}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="dcm4chee-arc">dcm4chee-arc</option>
            <option value="orthanc">Orthanc</option>
            <option value="conquest">Conquest DICOM</option>
          </select>

          {searchResults.length > 0 && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
            >
              Clear
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="ml-auto bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-900 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'SUBMIT'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mx-6 mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-800 text-white">
            <h2 className="text-xl font-bold">
              Search Results ({searchResults.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Study Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Modality
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Accession #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {searchResults.map((study, index) => (
                  <tr key={study.id || index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {study.patientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {study.patientId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {study.studyDate}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {study.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {study.accessionNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() =>
                          navigate(`/series?studyUID=${study.studyInstanceUID}`)
                        }
                        className="px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-900"
                      >
                        View Series
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isSearching && !error && (
        <div className="mx-6 mb-6 bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No Results Yet
          </h3>
          <p className="text-slate-600">
            Enter search criteria and click SUBMIT to find studies
          </p>
        </div>
      )}
    </div>
  );
}

// Reusable Input Component
function Input({ label, name, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-blue-500 transition"
      />
    </label>
  );
}

// Date Input Component
function DateInput({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-blue-500 transition"
      />
    </label>
  );
}

// Select Component
function Select({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-blue-500 transition"
      >
        <option value="">All</option>
        <option value="CT">CT</option>
        <option value="MR">MR</option>
        <option value="US">US</option>
        <option value="CR">CR</option>
        <option value="DX">DX</option>
        <option value="XA">XA</option>
        <option value="NM">NM</option>
        <option value="PT">PT</option>
        <option value="OT">OT</option>
      </select>
    </label>
  );
}

// Checkbox Component
function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}