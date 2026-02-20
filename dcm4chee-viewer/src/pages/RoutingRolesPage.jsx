import { useState, useEffect } from 'react';
import { fetchExportRules, createExportRule, deleteExportRule } from '../services/dcmchee';

export default function RoutingRolesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState({
    dicomExporterID: '',
    dicomDescription: '',
    dicomURI: '',
    dicomAETitle: '',
    dicomQueueName: 'Export1',
    dicomSchedule: '',
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExportRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading export rules:', err);
      setError(`Failed to load export rules: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setNewRule({
      dicomExporterID: '',
      dicomDescription: '',
      dicomURI: '',
      dicomAETitle: '',
      dicomQueueName: 'Export1',
      dicomSchedule: '',
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleSaveNew = async () => {
    if (!newRule.dicomExporterID || !newRule.dicomURI) {
      alert('Exporter ID and URI are required');
      return;
    }

    try {
      await createExportRule(newRule);
      setIsAdding(false);
      loadRules();
    } catch (err) {
      alert(`Failed to create rule: ${err.message}`);
    }
  };

  const handleDelete = async (exporterId) => {
    if (!confirm(`Are you sure you want to delete exporter "${exporterId}"?`)) {
      return;
    }

    try {
      await deleteExportRule(exporterId);
      loadRules();
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  const filteredRules = rules.filter(rule => {
    const searchLower = searchTerm.toLowerCase();
    const exporterId = rule.dicomExporterID || '';
    const description = rule.dicomDescription || '';
    const uri = rule.dicomURI || '';
    return (
      exporterId.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower) ||
      uri.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
          <h2 className="text-2xl mt-2 font-semibold text-gray-800">Export / Routing Rules</h2>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search export rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadRules}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleAddNew}
              disabled={isAdding}
              className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-50"
            >
              Add New Rule
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
              <p className="mt-4 text-gray-600">Loading export rules...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredRules.length} export rule{filteredRules.length !== 1 ? 's' : ''}
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full bg-white">
                  <thead className="bg-[#0a6e79] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Exporter ID</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">URI</th>
                      <th className="px-4 py-3 text-left">AE Title</th>
                      <th className="px-4 py-3 text-left">Queue Name</th>
                      <th className="px-4 py-3 text-left">Schedule</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add New Row */}
                    {isAdding && (
                      <tr className="border-b bg-blue-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomExporterID}
                            onChange={(e) => setNewRule({ ...newRule, dicomExporterID: e.target.value })}
                            placeholder="Exporter ID*"
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomDescription}
                            onChange={(e) => setNewRule({ ...newRule, dicomDescription: e.target.value })}
                            placeholder="Description"
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomURI}
                            onChange={(e) => setNewRule({ ...newRule, dicomURI: e.target.value })}
                            placeholder="dicom://AET@host:port*"
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomAETitle}
                            onChange={(e) => setNewRule({ ...newRule, dicomAETitle: e.target.value })}
                            placeholder="AE Title"
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomQueueName}
                            onChange={(e) => setNewRule({ ...newRule, dicomQueueName: e.target.value })}
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={newRule.dicomSchedule}
                            onChange={(e) => setNewRule({ ...newRule, dicomSchedule: e.target.value })}
                            placeholder="e.g., hour=0"
                            className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveNew}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelAdd}
                              className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Existing Rows */}
                    {filteredRules.length === 0 && !isAdding ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                          {searchTerm ? 'No export rules found matching your search.' : 'No export rules configured.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRules.map((rule, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[#0a6e79]">{rule.dicomExporterID || '—'}</span>
                          </td>
                          <td className="px-4 py-3">{rule.dicomDescription || '—'}</td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{rule.dicomURI || '—'}</code>
                          </td>
                          <td className="px-4 py-3">{rule.dicomAETitle || '—'}</td>
                          <td className="px-4 py-3">{rule.dicomQueueName || '—'}</td>
                          <td className="px-4 py-3">{rule.dicomSchedule || '—'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDelete(rule.dicomExporterID)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
