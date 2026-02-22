import { useState, useEffect } from 'react';
import { fetchTransformRules, createTransformRule, fetchApplicationEntities, fetchDevices } from '../services/dcmchee';

const BLANK = {
  cn: '', description: '', deviceName: '', localAETitle: '', sourceAE: '', target: '', gateway: '', priority: '',
};

const inp =
  'w-full px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none ' +
  'focus:ring-1 focus:ring-[#0a6e79] focus:border-[#0a6e79] bg-white placeholder-gray-400';

const sel =
  'w-full px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none ' +
  'focus:ring-1 focus:ring-[#0a6e79] focus:border-[#0a6e79] bg-white text-gray-700';

const statusBadge = (status) => {
  const s = (status || 'active').toLowerCase();
  if (s === 'active')   return 'px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium';
  if (s === 'disabled') return 'px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium';
  return 'px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium';
};

export default function TransformRulesPage() {
  const [rules,       setRules]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [aeTitles,    setAeTitles]    = useState([]);
  const [deviceNames, setDeviceNames] = useState([]);

  const [adding,    setAdding]    = useState(false);
  const [newRule,   setNewRule]   = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadRules();
    fetchApplicationEntities()
      .then(data => {
        const titles = (Array.isArray(data) ? data : []).map(ae =>
          typeof ae === 'string' ? ae : (ae.dicomAETitle || ae.aet || '')
        ).filter(Boolean);
        setAeTitles(titles);
      })
      .catch(() => {});
    fetchDevices()
      .then(data => {
        const names = (Array.isArray(data) ? data : []).map(d =>
          typeof d === 'string' ? d : (d.dicomDeviceName || '')
        ).filter(Boolean);
        setDeviceNames(names);
      })
      .catch(() => {});
  }, []);

  const loadRules = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchTransformRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Failed to load: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd    = () => { setAdding(true); setNewRule(BLANK); setSaveError(null); };
  const handleCancel = () => { setAdding(false); setSaveError(null); };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      await createTransformRule(newRule);
      setRules(prev => [...prev, {
        cn:           newRule.cn || `coercion-rule-${prev.length + 1}`,
        description:  newRule.description,
        deviceName:   newRule.deviceName,
        localAETitle: newRule.localAETitle,
        sourceAE:     newRule.sourceAE,
        target:       newRule.target,
        gateway:      newRule.gateway,
        priority:     newRule.priority ? Number(newRule.priority) : 0,
        status:       'active',
      }]);
      setAdding(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = rules.filter(rule => {
    const s = searchTerm.toLowerCase();
    return (
      (rule.cn || '').toLowerCase().includes(s) ||
      (rule.description || '').toLowerCase().includes(s) ||
      (rule.localAETitle || '').toLowerCase().includes(s) ||
      (rule.sourceAE || '').toLowerCase().includes(s)
    );
  });

  const showTable = !loading && (filtered.length > 0 || adding);

  const AEDatalist = () => (
    <datalist id="ae-options-transform">
      {aeTitles.map(ae => <option key={ae} value={ae} />)}
    </datalist>
  );

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block shrink-0" />
          <h2 className="text-xl sm:text-2xl mt-2 font-semibold text-gray-800">Transform Rules</h2>
        </div>

        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search transform rules..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button
              onClick={loadRules}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-40 whitespace-nowrap"
            >
              + Add Rule
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a6e79]" />
              <p className="mt-4 text-gray-600">Loading Transform Rules...</p>
            </div>
          ) : !showTable ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⚙️</div>
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No rules match your search.' : 'No Transform Rules configured.'}
              </p>
              <button
                onClick={handleAdd}
                className="mt-4 px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition"
              >
                + Add First Rule
              </button>
            </div>
          ) : (
            <>
              <AEDatalist />
              <div className="mb-3 text-sm text-gray-500">
                {filtered.length} rule{filtered.length !== 1 ? 's' : ''}
                {adding && <span className="ml-2 text-[#0a6e79] font-medium">• Adding new rule…</span>}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a6e79] text-white text-left">
                      <th className="px-4 py-3 font-semibold w-8">#</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                      <th className="px-4 py-3 font-semibold">Local AE</th>
                      <th className="px-4 py-3 font-semibold">Source AE</th>
                      <th className="px-4 py-3 font-semibold">Target URI</th>
                      <th className="px-4 py-3 font-semibold">Gateway</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rule, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-gray-100 hover:bg-[#00768308] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-[#0a6e79]">{rule.cn || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{rule.description || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">{rule.deviceName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{rule.localAETitle || '—'}</td>
                        <td className="px-4 py-3">
                          {rule.sourceAE
                            ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{rule.sourceAE}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {rule.target
                            ? <code className="bg-gray-100 px-2 py-0.5 rounded">{rule.target}</code>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{rule.gateway || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={statusBadge(rule.status)}>
                            {(rule.status || 'active').charAt(0).toUpperCase() + (rule.status || 'active').slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Inline add row */}
                    {adding && (
                      <tr className="border-t-2 border-[#0a6e79] bg-teal-50/60">
                        <td className="px-3 py-2 text-[#0a6e79] font-bold text-xs">NEW</td>
                        <td className="px-3 py-2">
                          <input className={inp} placeholder="Rule name" value={newRule.cn}
                            onChange={e => setNewRule(p => ({ ...p, cn: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} placeholder="Description" value={newRule.description}
                            onChange={e => setNewRule(p => ({ ...p, description: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <select className={sel} value={newRule.deviceName}
                            onChange={e => setNewRule(p => ({ ...p, deviceName: e.target.value }))}>
                            <option value="">— Device —</option>
                            {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select className={sel} value={newRule.localAETitle}
                            onChange={e => setNewRule(p => ({ ...p, localAETitle: e.target.value }))}>
                            <option value="">— AE —</option>
                            {aeTitles.map(ae => <option key={ae} value={ae}>{ae}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} list="ae-options-transform" placeholder="Source AE pattern"
                            value={newRule.sourceAE}
                            onChange={e => setNewRule(p => ({ ...p, sourceAE: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} placeholder="file:///path/xsl" value={newRule.target}
                            onChange={e => setNewRule(p => ({ ...p, target: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} placeholder="Gateway" value={newRule.gateway}
                            onChange={e => setNewRule(p => ({ ...p, gateway: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <button onClick={handleSave} disabled={saving}
                              className="px-3 py-1 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                              {saving ? '...' : 'Save'}
                            </button>
                            <button onClick={handleCancel} disabled={saving}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {saveError && (
                  <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-xs">{saveError}</div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((rule, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-[#0a6e79] text-sm">{rule.cn || `Rule #${idx + 1}`}</span>
                      <span className={statusBadge(rule.status)}>
                        {(rule.status || 'active').charAt(0).toUpperCase() + (rule.status || 'active').slice(1)}
                      </span>
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
                          <span className="text-gray-500 text-xs uppercase font-medium">Device</span>
                          <p className="text-gray-700">{rule.deviceName || '—'}</p>
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-500 text-xs uppercase font-medium">Local AE</span>
                          <p className="text-gray-700">{rule.localAETitle || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs uppercase font-medium">Source AE</span>
                        <p className="text-gray-700">{rule.sourceAE || '—'}</p>
                      </div>
                      {rule.target && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-medium">Target</span>
                          <p className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">{rule.target}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Mobile inline add form */}
                {adding && (
                  <div className="bg-teal-50 border-2 border-[#0a6e79] rounded-xl p-4 shadow-sm space-y-2">
                    <span className="font-semibold text-[#0a6e79] text-sm block mb-1">New Transform Rule</span>

                    {[
                      { label: 'Name (cn)',  key: 'cn',       ph: 'coercion-rule-1' },
                      { label: 'Description', key: 'description', ph: 'Description' },
                      { label: 'Target URI',  key: 'target',   ph: 'file:///path/xsl' },
                      { label: 'Gateway',     key: 'gateway',  ph: 'Gateway' },
                      { label: 'Priority',    key: 'priority', ph: '0', type: 'number' },
                    ].map(({ label, key, ph, type }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 uppercase font-medium">{label}</label>
                        <input type={type || 'text'} placeholder={ph}
                          value={newRule[key]}
                          onChange={e => setNewRule(p => ({ ...p, [key]: e.target.value }))}
                          className={`${inp} mt-0.5`} />
                      </div>
                    ))}

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Device</label>
                      <select className={`${sel} mt-0.5`} value={newRule.deviceName}
                        onChange={e => setNewRule(p => ({ ...p, deviceName: e.target.value }))}>
                        <option value="">— Select Device —</option>
                        {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Local AE</label>
                      <select className={`${sel} mt-0.5`} value={newRule.localAETitle}
                        onChange={e => setNewRule(p => ({ ...p, localAETitle: e.target.value }))}>
                        <option value="">— Select AE —</option>
                        {aeTitles.map(ae => <option key={ae} value={ae}>{ae}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Source AE</label>
                      <input list="ae-options-transform" className={`${inp} mt-0.5`} placeholder="AE pattern or select"
                        value={newRule.sourceAE}
                        onChange={e => setNewRule(p => ({ ...p, sourceAE: e.target.value }))} />
                    </div>

                    {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save Rule'}
                      </button>
                      <button onClick={handleCancel} disabled={saving}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
