import { useState, useEffect } from 'react';
import { fetchApplicationEntities } from '../services/dcmchee';

export default function AEListPage() {
  const [aes, setAes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAEs();
  }, []);

  const loadAEs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApplicationEntities();
      setAes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading AEs:', err);
      setError(`Failed to load Application Entities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAEs = aes.filter(ae => {
    const searchLower = searchTerm.toLowerCase();
    const aeTitle = typeof ae === 'string' ? ae : (ae.dicomAETitle || ae.aet || '');
    const aeDesc = typeof ae === 'object' ? (ae.dicomDescription || '') : '';
    return aeTitle.toLowerCase().includes(searchLower) || aeDesc.toLowerCase().includes(searchLower);
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">Application Entity (AE) Titles</h2>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search AE titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadAEs}
              disabled={loading}
              className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a6e79]"></div>
              <p className="mt-4 text-gray-600">Loading Application Entities...</p>
            </div>
          ) : filteredAEs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📡</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No AE titles found matching your search.' : 'No Application Entities configured.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredAEs.length} AE title{filteredAEs.length !== 1 ? 's' : ''}
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full bg-white">
                  <thead className="bg-[#0a6e79] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">AE Title</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Device</th>
                      <th className="px-4 py-3 text-left">Hostname</th>
                      <th className="px-4 py-3 text-left">Port</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAEs.map((ae, idx) => {
                      const aeTitle = typeof ae === 'string' ? ae : (ae.dicomAETitle || ae.aet || '—');
                      const aeDesc = typeof ae === 'object' ? (ae.dicomDescription || '—') : '—';
                      const deviceName = typeof ae === 'object' ? (ae.dicomDeviceName || '—') : '—';
                      const hostname = typeof ae === 'object' ? (ae.dicomHostname || '—') : '—';
                      const port = typeof ae === 'object' ? (ae.dicomPort || '—') : '—';

                      return (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[#0a6e79]">{aeTitle}</span>
                          </td>
                          <td className="px-4 py-3">{aeDesc}</td>
                          <td className="px-4 py-3">{deviceName}</td>
                          <td className="px-4 py-3">{hostname}</td>
                          <td className="px-4 py-3">{port}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
