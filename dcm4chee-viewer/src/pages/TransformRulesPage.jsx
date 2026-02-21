import { useState, useEffect } from 'react';
import { fetchTransformRules } from '../services/dcmchee';

export default function TransformRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransformRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading transform rules:', err);
      setError(`Failed to load transform rules: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const s = searchTerm.toLowerCase();
    return (
      (rule.cn || '').toLowerCase().includes(s) ||
      (rule.description || '').toLowerCase().includes(s) ||
      (rule.localAETitle || '').toLowerCase().includes(s) ||
      (rule.sourceAE || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block shrink-0" />
          <h2 className="text-xl sm:text-2xl mt-2 font-semibold text-gray-800">Transform Rules</h2>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search transform rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadRules}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a6e79]"></div>
              <p className="mt-4 text-gray-600">Loading Transform Rules...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⚙️</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No rules found matching your search.' : 'No Transform Rules configured.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-500">
                Found {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a6e79] text-white text-left">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">AE Local</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Target</th>
                      <th className="px-4 py-3 font-semibold">Gateway</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-gray-100 hover:bg-[#00768308] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-[#0a6e79]">{rule.cn || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{rule.description || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{rule.localAETitle || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {rule.sourceAE
                            ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{rule.sourceAE}</span>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {rule.target
                            ? <code className="bg-gray-100 px-2 py-0.5 rounded">{rule.target}</code>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{rule.gateway || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredRules.map((rule, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-[#0a6e79] text-sm">{rule.cn || `Rule #${idx + 1}`}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {rule.description && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-medium">Description</span>
                          <p className="text-gray-700">{rule.description}</p>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <span className="text-gray-500 text-xs uppercase font-medium">AE Local</span>
                          <p className="text-gray-700">{rule.localAETitle || '—'}</p>
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-500 text-xs uppercase font-medium">Source</span>
                          <p className="text-gray-700">{rule.sourceAE || '—'}</p>
                        </div>
                      </div>
                      {rule.target && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-medium">Target</span>
                          <p className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">{rule.target}</p>
                        </div>
                      )}
                      {rule.gateway && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-medium">Gateway</span>
                          <p className="text-gray-700">{rule.gateway}</p>
                        </div>
                      )}
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
