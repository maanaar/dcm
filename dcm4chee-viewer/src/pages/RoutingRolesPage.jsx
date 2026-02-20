import { useState } from 'react';

export default function RoutingRolesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API call when endpoint is available
  const routingRoles = [
    {
      id: 1,
      name: 'Auto-Route CT Studies',
      description: 'Automatically route all CT studies to PACS server',
      sourceAE: 'CT_MODALITY',
      destinationAE: 'PACS_STORAGE',
      modality: 'CT',
      status: 'active',
      rulesCount: 3,
    },
    {
      id: 2,
      name: 'Emergency Studies Priority',
      description: 'High priority routing for emergency department studies',
      sourceAE: 'ER_MODALITY',
      destinationAE: 'ER_PACS',
      modality: 'All',
      status: 'active',
      rulesCount: 5,
    },
    {
      id: 3,
      name: 'MRI Long-term Archive',
      description: 'Route MRI studies to long-term storage after 90 days',
      sourceAE: 'MRI_WORKSTATION',
      destinationAE: 'ARCHIVE_STORAGE',
      modality: 'MR',
      status: 'inactive',
      rulesCount: 2,
    },
  ];

  const filteredRoles = routingRoles.filter(role => {
    const searchLower = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(searchLower) ||
      role.description.toLowerCase().includes(searchLower) ||
      role.sourceAE.toLowerCase().includes(searchLower) ||
      role.destinationAE.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">Routing Roles</h2>
        </div>

        {/* Info Banner */}
        <div className="m-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About Routing Roles</h3>
              <p className="text-sm text-blue-800">
                Routing roles define automatic forwarding rules for DICOM studies between different Application Entities.
                Configure source and destination AEs, filters, and conditions for automated study distribution.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-6 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search routing roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition">
              Add New Rule
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔀</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No routing roles found matching your search.' : 'No routing roles configured.'}
              </p>
              <button className="mt-4 px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition">
                Create First Rule
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredRoles.length} routing role{filteredRoles.length !== 1 ? 's' : ''}
              </div>

              <div className="space-y-4">
                {filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{role.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        role.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {role.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Source AE</p>
                        <p className="text-sm text-gray-800 font-semibold">{role.sourceAE}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Destination AE</p>
                        <p className="text-sm text-gray-800 font-semibold">{role.destinationAE}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Modality Filter</p>
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {role.modality}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {role.rulesCount} condition{role.rulesCount !== 1 ? 's' : ''} configured
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                          Edit
                        </button>
                        <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition">
                          View Details
                        </button>
                        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          role.status === 'active'
                            ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}>
                          {role.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
