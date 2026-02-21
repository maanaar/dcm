import { useState, useEffect } from 'react';
import { fetchApplicationEntities } from '../services/dcmchee';

export default function AppEntitiesList() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApplicationEntities();
      setEntities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading entities:', err);
      setError(`Failed to load entities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = entities.filter(entity => {
    const searchLower = searchTerm.toLowerCase();
    const aeTitle = typeof entity === 'string' ? entity : (entity.dicomAETitle || entity.aet || '');
    const aeDesc = typeof entity === 'object' ? (entity.dicomDescription || '') : '';
    const matchSearch = aeTitle.toLowerCase().includes(searchLower) || aeDesc.toLowerCase().includes(searchLower);

    // Add type filtering if entity type info is available
    return matchSearch;
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">Application Entities</h2>
        </div>

        {/* Filters & Search */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            >
              <option value="all">All Types</option>
              <option value="storage">Storage</option>
              <option value="query">Query/Retrieve</option>
              <option value="worklist">Worklist</option>
            </select>
            <button
              onClick={loadEntities}
              disabled={loading}
              className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap"
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
          ) : filteredEntities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔌</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No entities found matching your search.' : 'No Application Entities configured.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-500">
                Found {filteredEntities.length} entit{filteredEntities.length !== 1 ? 'ies' : 'y'}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a6e79] text-white text-left">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">AE Title</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                      <th className="px-4 py-3 font-semibold">Hostname</th>
                      <th className="px-4 py-3 font-semibold">Port</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntities.map((entity, idx) => {
                      const aeTitle    = typeof entity === 'string' ? entity : (entity.dicomAETitle || entity.aet || `Entity ${idx + 1}`);
                      const aeDesc     = typeof entity === 'object' ? (entity.dicomDescription || '—') : '—';
                      const deviceName = typeof entity === 'object' ? (entity.dicomDeviceName || '—') : '—';
                      const hostname   = typeof entity === 'object' ? (entity.dicomHostname || '—') : '—';
                      const port       = typeof entity === 'object' ? (entity.dicomPort || '—') : '—';

                      return (
                        <tr key={idx} className={`border-t border-gray-100 hover:bg-[#00768308] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-[#0a6e79]">{aeTitle}</td>
                          <td className="px-4 py-3 text-gray-600">{aeDesc}</td>
                          <td className="px-4 py-3 text-gray-600">{deviceName}</td>
                          <td className="px-4 py-3 text-gray-600">{hostname}</td>
                          <td className="px-4 py-3 text-gray-600">{port}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
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
