import React, { useState } from 'react';
import { searchSeries } from '../services/dcmchee';

export default function SeriesSearch() {
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    studyInstanceUID: '',
    seriesInstanceUID: '',
    seriesNumber: '',
    seriesDescription: '',
    modality: '',
    bodyPartExamined: '',
    performingPhysician: '',
    seriesDate: '',
    seriesTime: '',
    fuzzyMatching: false,
    orderBy: 'SeriesDate',
    webAppService: 'dcm4chee-arc',
    limit: '10000',
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchSeries(formData);
      setSearchResults(results);
      if (results.length === 0) setError('No series found matching your criteria.');
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to search series: ${err.message}`);
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
        <h2 className="text-2xl mt-2 font-semibold text-gray-800">Series</h2>
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

            {/* Study Instance UID */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Study Instance UID</label>
              <input
                name="studyInstanceUID"
                placeholder="Enter Study UID"
                value={formData.studyInstanceUID}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Series Instance UID */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Series Instance UID</label>
              <input
                name="seriesInstanceUID"
                placeholder="Enter Series UID"
                value={formData.seriesInstanceUID}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Series Number */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Series Number</label>
              <input
                name="seriesNumber"
                placeholder="Enter Series Number"
                value={formData.seriesNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Series Description */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Series Description</label>
              <input
                name="seriesDescription"
                placeholder="Enter Description"
                value={formData.seriesDescription}
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
            </div>

            {/* Body Part Examined */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Body Part Examined</label>
              <input
                name="bodyPartExamined"
                placeholder="e.g., CHEST, HEAD"
                value={formData.bodyPartExamined}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Performing Physician */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Performing Physician</label>
              <input
                name="performingPhysician"
                placeholder="Enter Physician Name"
                value={formData.performingPhysician}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Series Date */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Series Date</label>
              <input
                type="date"
                name="seriesDate"
                value={formData.seriesDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Series Time */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Series Time</label>
              <input
                type="time"
                name="seriesTime"
                value={formData.seriesTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
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
                <option value="dcm4chee-arc">DCM4CHEE Archive</option>
                <option value="orthanc">Orthanc</option>
                <option value="conquest">Conquest</option>
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Limit</label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              />
            </div>

            {/* Order By */}
            <div>
              <label className="block text-lg text-slate-600 mb-2">Order By</label>
              <select
                name="orderBy"
                value={formData.orderBy}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
              >
                <option value="SeriesDate">Series Date</option>
                <option value="-SeriesDate">Series Date (Desc)</option>
                <option value="SeriesNumber">Series Number</option>
                <option value="-SeriesNumber">Series Number (Desc)</option>
                <option value="Modality">Modality</option>
              </select>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end px-6 pb-6">
            <button
              type="button"
              onClick={() => setFormData({
                patientFamilyName: '', patientId: '', studyInstanceUID: '', seriesInstanceUID: '',
                seriesNumber: '', seriesDescription: '', modality: '', bodyPartExamined: '',
                performingPhysician: '', seriesDate: '', seriesTime: '', fuzzyMatching: false,
                orderBy: 'SeriesDate', webAppService: 'dcm4chee-arc', limit: '10000',
              })}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Found {searchResults.length} series
            </h3>
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition"
            >
              Clear Results
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full bg-white">
              <thead className="bg-[#0a6e79] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Series #</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Modality</th>
                  <th className="px-4 py-3 text-left">Body Part</th>
                  <th className="px-4 py-3 text-left">Physician</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Instances</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((series, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{series.seriesNumber || '—'}</td>
                    <td className="px-4 py-3">{series.seriesDescription || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {series.modality || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{series.bodyPartExamined || '—'}</td>
                    <td className="px-4 py-3">{series.performingPhysician || '—'}</td>
                    <td className="px-4 py-3">{series.seriesDate || '—'}</td>
                    <td className="px-4 py-3">{series.seriesTime || '—'}</td>
                    <td className="px-4 py-3">{series.numberOfInstances || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
