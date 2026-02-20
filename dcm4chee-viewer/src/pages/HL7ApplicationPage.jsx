import { useState, useEffect } from 'react';
import { fetchHL7Applications } from '../services/dcmchee';

export default function HL7ApplicationPage() {
  const [hl7Apps, setHL7Apps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHL7Apps();
  }, []);

  const loadHL7Apps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHL7Applications();
      setHL7Apps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading HL7 apps:', err);
      setError(`Failed to load HL7 Applications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredHL7Apps = hl7Apps.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    const appName = typeof app === 'string' ? app : (app.hl7ApplicationName || app.name || '');
    const appDesc = typeof app === 'object' ? (app.dicomDescription || '') : '';
    return appName.toLowerCase().includes(searchLower) || appDesc.toLowerCase().includes(searchLower);
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">HL7 Applications</h2>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search HL7 applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadHL7Apps}
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
              <p className="mt-4 text-gray-600">Loading HL7 Applications...</p>
            </div>
          ) : filteredHL7Apps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏥</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No HL7 applications found matching your search.' : 'No HL7 Applications configured.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredHL7Apps.length} HL7 application{filteredHL7Apps.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHL7Apps.map((app, idx) => {
                  const appName = typeof app === 'string' ? app : (app.hl7ApplicationName || app.name || `HL7 App ${idx + 1}`);
                  const appDesc = typeof app === 'object' ? (app.dicomDescription || '') : '';
                  const deviceName = typeof app === 'object' ? (app.dicomDeviceName || '') : '';
                  const acceptedMsgTypes = typeof app === 'object' && Array.isArray(app.hl7AcceptedMessageType) ? app.hl7AcceptedMessageType : [];

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{appName}</h3>
                          {appDesc && (
                            <p className="text-sm text-gray-600 mt-1">{appDesc}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          HL7
                        </span>
                      </div>

                      {deviceName && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 font-medium">Device: </span>
                          <span className="text-sm text-gray-700">{deviceName}</span>
                        </div>
                      )}

                      {acceptedMsgTypes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-medium mb-2">Accepted Message Types:</p>
                          <div className="flex flex-wrap gap-1">
                            {acceptedMsgTypes.slice(0, 5).map((msgType, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                {msgType}
                              </span>
                            ))}
                            {acceptedMsgTypes.length > 5 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{acceptedMsgTypes.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
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
