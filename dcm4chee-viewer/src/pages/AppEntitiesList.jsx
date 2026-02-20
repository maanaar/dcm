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
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Found {filteredEntities.length} entit{filteredEntities.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntities.map((entity, idx) => {
                  const aeTitle = typeof entity === 'string' ? entity : (entity.dicomAETitle || entity.aet || `Entity ${idx + 1}`);
                  const aeDesc = typeof entity === 'object' ? (entity.dicomDescription || '') : '';
                  const deviceName = typeof entity === 'object' ? (entity.dicomDeviceName || '') : '';
                  const hostname = typeof entity === 'object' ? (entity.dicomHostname || '') : '';
                  const port = typeof entity === 'object' ? (entity.dicomPort || '') : '';

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#0a6e79] text-xl">{aeTitle}</h3>
                          {aeDesc && (
                            <p className="text-sm text-gray-600 mt-1">{aeDesc}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>

                      <div className="space-y-2">
                        {deviceName && (
                          <div className="text-sm">
                            <span className="text-gray-500 font-medium">Device:</span>
                            <span className="ml-2 text-gray-700">{deviceName}</span>
                          </div>
                        )}
                        {hostname && (
                          <div className="text-sm">
                            <span className="text-gray-500 font-medium">Host:</span>
                            <span className="ml-2 text-gray-700">{hostname}</span>
                          </div>
                        )}
                        {port && (
                          <div className="text-sm">
                            <span className="text-gray-500 font-medium">Port:</span>
                            <span className="ml-2 text-gray-700">{port}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          DICOM
                        </span>
                        <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-medium">
                          C-STORE
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
