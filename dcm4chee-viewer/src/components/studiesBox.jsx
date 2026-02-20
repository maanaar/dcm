import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStudies, fetchWebApps } from '../services/dcmchee';

export default function StudiesBox() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    accessionNumber: '',
    fuzzyMatching: false,
    issuerOfPatient: '',
    issuerOfAccessionNumber: '',
    studyDescription: '',
    modality: '',
    reportStatus: '',
    referringPhysician: '',
    institutionalDepartmentName: '',
    sendingAET: '',
    institutionalName: '',
    studyDate: '',
    studyTime: '',
    studyReceived: '',
    studyAccess: '',
    orderBy: 'StudyDate',
    webAppService: 'dcm4chee-arc',
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [error, setError]                 = useState(null);
  const [webApps, setWebApps] = useState([]);

  useEffect(() => {
    loadWebApps();
  }, []);

  const loadWebApps = async () => {
    try {
      const apps = await fetchWebApps();
      setWebApps(apps);
      if (apps.length > 0 && apps[0].webAppName) {
        setFormData(prev => ({ ...prev, webAppService: apps[0].webAppName }));
      }
    } catch (err) {
      console.error('Error loading web apps:', err);
      setWebApps([{ webAppName: 'dcm4chee-arc', description: 'DCM4CHEE Archive' }]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchStudies(formData);
      setSearchResults(results);
      if (results.length === 0) setError('No studies found matching your criteria.');
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
    <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

      {/* Header */}
      <div className="flex gap-2 px-6 py-3 border-b">
        <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
        <h2 className="text-2xl mt-2 font-semibold text-gray-800">Studies</h2>
      </div>

      {/* Search Form */}
      <div className="bg-white/50 rounded-xl shadow-lg p-6 mx-auto mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">

            {/* Patient Family Name */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Patient Family Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="patientFamilyName"
                  value={formData.patientFamilyName}
                  onChange={handleInputChange}
                  placeholder="Enter family name"
                  className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
                />
                <label className="flex items-center text-sm text-slate-500 mt-2">
                  <input
                    type="checkbox"
                    name="fuzzyMatching"
                    checked={formData.fuzzyMatching}
                    onChange={handleInputChange}
                    className="mr-2 accent-[#0a6e79]"
                  />
                  Fuzzy Matching
                </label>
              </div>
            </div>

            {/* Patient ID */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Patient ID</label>
              <input
                name="patientId"
                placeholder="Enter Patient ID"
                value={formData.patientId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Institutional Name */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Institutional name</label>
              <input
                name="institutionalName"
                placeholder="Enter Institutional name"
                value={formData.institutionalName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Modality */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Modality</label>
              <select
                name="modality"
                value={formData.modality}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              >
                <option value="All">All</option>
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
            </div>

            {/* Accession Number */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Accession number</label>
              <input
                name="accessionNumber"
                placeholder="Enter Accession number"
                value={formData.accessionNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Study Description */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Study Description</label>
              <input
                name="studyDescription"
                placeholder="Enter Study Description"
                value={formData.studyDescription}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Study Date */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Study date</label>
              <input
                type="date"
                name="studyDate"
                value={formData.studyDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800 [&::-webkit-calendar-picker-indicator]:text-gray-800"
              />
            </div>

            {/* Report Status */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Report Status</label>
              <select
                name="reportStatus"
                value={formData.reportStatus}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              >
                <option value="">All</option>
                <option value="Done">Done</option>
                <option value="Send">Send</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Web App Service */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Archive</label>
              <select
                name="webAppService"
                value={formData.webAppService}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              >
                {webApps.length > 0 ? (
                  webApps.map((app, idx) => (
                    <option key={idx} value={app.webAppName || app.id || app.name}>
                      {app.description || app.webAppName || app.name}
                    </option>
                  ))
                ) : (
                  <option value="dcm4chee-arc">DCM4CHEE Archive</option>
                )}
              </select>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center gap-4 px-6 py-4 border-t">
            {searchResults.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition text-sm font-medium"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="ml-auto px-8 py-3 text-white rounded-2xl hover:bg-[#05383d] transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a6e79]"
            >
              {isSearching ? 'Searching…' : 'SUBMIT'}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-6 mb-6">
          <div className="px-6 py-4 bg-[#0a6e79] text-white flex items-center justify-between">
            <h2 className="text-xl font-bold">Search Results</h2>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {searchResults.length} studies
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Patient Name',
                    'Patient ID',
                    'Priority',
                    'Status',
                    'No. of Images',   /* ← maps to numberOfInstances */
                    'Study Date',
                    'Modality',
                    'Description',
                    'Accession #',
                    'Actions',
                  ].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {searchResults.map((study, index) => (
                  <tr key={study.id || index} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{study.patientName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.patientId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.priority ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.status ?? '—'}</td>
                    {/* ✅ numberOfInstances = total images in the study */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {study.numberOfInstances ?? study.noImages ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.studyDate}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.description || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{study.accessionNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => navigate(`/series?studyUID=${study.studyInstanceUID}`)}
                        className="px-3 py-1.5 bg-[#0a6e79] text-white text-xs rounded-lg hover:bg-slate-900 transition font-medium"
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
        <div className="bg-white/50 rounded-xl shadow-lg p-12 text-center mx-6 mb-6">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Results Yet</h3>
          <p className="text-slate-500">Enter search criteria and click SUBMIT to find studies</p>
        </div>
      )}
    </div>
  );
}