import { useState, useEffect } from 'react';
import { fetchDevices } from '../services/dcmchee';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError(`Failed to load devices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device => {
    const searchLower = searchTerm.toLowerCase();
    const deviceName = typeof device === 'string' ? device : (device.dicomDeviceName || device.name || '');
    return deviceName.toLowerCase().includes(searchLower);
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">Devices Configuration</h2>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search devices by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadDevices}
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
              <p className="mt-4 text-gray-600">Loading devices...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🖥️</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No devices found matching your search.' : 'No devices configured.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((device, idx) => {
                  const deviceName = typeof device === 'string' ? device : (device.dicomDeviceName || device.name || `Device ${idx + 1}`);
                  const deviceDesc = typeof device === 'object' && device.dicomDescription ? device.dicomDescription : '';
                  const manufacturer = typeof device === 'object' && device.dicomManufacturer ? device.dicomManufacturer : '';

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{deviceName}</h3>
                          {deviceDesc && (
                            <p className="text-sm text-gray-600 mt-1">{deviceDesc}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      {manufacturer && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Manufacturer:</span> {manufacturer}
                          </p>
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
