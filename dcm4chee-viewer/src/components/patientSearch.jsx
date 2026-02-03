import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPatients } from '../services/dcmchee'; // Import the API function

export default function PatientSearch() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    issuerOfPatient: '',
    limitOfPatients: '25',
    orderBy: 'PatientName',
    patientSex: '',
    birthDate: '',
    verificationStatus: '',
    webAppService: 'dcm4chee-arc',
    fuzzyMatching: false,
    onlyWithStudies: false,
    mergedPatients: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    
    try {
      // Call the real API
      const results = await searchPatients(formData);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No patients found matching your criteria.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to search patients: ${err.message}`);
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
    <div className=" wallpaper-page w-full bg-white/50  rounded-2xl  backdrop-blur-md border shadow" >
      {/* Header */}
      <div className="flex gap-2 px-6 py-3 border-b">
        <span className="text-2xl text-[rgb(215,160,56)]">  <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" /></span>
        <h2 className="text-2xl  mt-2  font-semibold">Patients</h2>
      </div>

      {/* Search Form */}
      <div className="bg-white/50  rounded-xl  shadow-lg p-6 mx-auto mb-6" >
        <form onSubmit={handleSubmit}>
          {/* Basic Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Patient Family Name */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Patient Family Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="patientFamilyName"
                  value={formData.patientFamilyName}
                  onChange={handleInputChange}
                  placeholder="Enter family name"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="absolute right-3 top-2 flex items-center text-sm text-slate-500">
                  <input
                    type="checkbox"
                    name="fuzzyMatching"
                    checked={formData.fuzzyMatching}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Fuzzy
                </label>
              </div>
            </div>

            {/* Patient ID */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                placeholder="Enter patient ID"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Issuer of Patient */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Issuer of Patient
              </label>
              <input
                type="text"
                name="issuerOfPatient"
                value={formData.issuerOfPatient}
                onChange={handleInputChange}
                placeholder="Enter issuer"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Limit of Patients */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Limit of Patients
              </label>
              <input
                type="number"
                name="limitOfPatients"
                value={formData.limitOfPatients}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order By */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Order By
              </label>
              <select
                name="orderBy"
                value={formData.orderBy}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PatientName">Patient Name</option>
                <option value="PatientID">Patient ID</option>
                <option value="PatientBirthDate">Birth Date</option>
                <option value="-createdTime">Created Time (Desc)</option>
                <option value="-updatedTime">Updated Time (Desc)</option>
              </select>
            </div>

            {/* Web App Service */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Web App Service
              </label>
              <select
                name="webAppService"
                value={formData.webAppService}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dcm4chee-arc">dcm4chee-arc</option>
                <option value="orthanc">Orthanc</option>
                <option value="conquest">Conquest DICOM</option>
              </select>
            </div>
          </div>

          {/* Advanced Section Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center gap-2"
          >
            {showAdvanced ? '▲ Close More Filters' : '▼ More Filters'}
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-4 bg-slate-50 rounded-lg">
              {/* Patient's Sex */}
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Patient's Sex
                </label>
                <select
                  name="patientSex"
                  value={formData.patientSex}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Verification Status
                </label>
                <select
                  name="verificationStatus"
                  value={formData.verificationStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="NOT_AVAILABLE">Not Available</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="onlyWithStudies"
                    checked={formData.onlyWithStudies}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Only with Studies
                </label>
                <label className="flex items-center text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="mergedPatients"
                    checked={formData.mergedPatients}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Merged Patients
                </label>
              </div>
            </div>
          )}

          {/* Submit and Clear Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'SUBMIT'}
            </button>
            
            {searchResults.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-8 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition"
              >
                Clear Results
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-800 text-white">
            <h2 className="text-xl font-bold">Search Results ({searchResults.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Patient ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Sex</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Birth Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Studies</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Issuer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {searchResults.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-900">{patient.patientId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{patient.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.sex || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.birthDate || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {patient.studies} studies
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.issuer || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => navigate(`/studies?patientId=${patient.patientId}`)}
                        className="px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-900 transition"
                      >
                        View Studies
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
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Results Yet</h3>
          <p className="text-slate-600">Enter search criteria and click SUBMIT to find patients</p>
        </div>
      )}
    </div>
  );
}