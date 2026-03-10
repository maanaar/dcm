import { useState, useEffect, useRef } from 'react';
import {
  fetchExporters, createExporter, deleteExporter,
  fetchExportRules, createExportRule, deleteExportRule,
  fetchExportTasks,
  fetchExportTaskList, countExportTasksFiltered,
  cancelExportTasks, rescheduleExportTasks, deleteExportTasks,
  getExportTasksCSVUrl,
  fetchApplicationEntities, fetchDevices,
} from '../services/dcmchee';

// ── shared styles ────────────────────────────────────────────────────────────
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

const formatList = (val) =>
  Array.isArray(val) ? (val.length ? val.join(', ') : '—') : (val || '—');

// ── Exporters tab ────────────────────────────────────────────────────────────
const BLANK_EXP = { deviceName: '', exporterID: '', aeTitle: '', uri: '', queueName: '', storageID: '', description: '' };

const TASK_STATUSES = [
  { key: 'SCHEDULED',  label: 'Scheduled',   color: 'bg-blue-100 text-blue-700' },
  { key: 'IN PROCESS', label: 'In Process',  color: 'bg-yellow-100 text-yellow-700' },
  { key: 'COMPLETED',  label: 'Completed',   color: 'bg-green-100 text-green-700' },
  { key: 'WARNING',    label: 'Warning',     color: 'bg-orange-100 text-orange-700' },
  { key: 'FAILED',     label: 'Failed',      color: 'bg-red-100 text-red-700' },
  { key: 'CANCELED',   label: 'Canceled',    color: 'bg-gray-100 text-gray-500' },
];

function ExportersTab({ aeTitles, deviceNames }) {
  const [exporters,  setExporters]  = useState([]);
  const [taskStats,  setTaskStats]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [adding,     setAdding]     = useState(false);
  const [newExp,     setNewExp]     = useState(BLANK_EXP);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [exps, tasks] = await Promise.all([fetchExporters(), fetchExportTasks()]);
      setExporters(exps);
      setTaskStats(tasks);
    } catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      await createExporter(newExp);
      setExporters(prev => [...prev, { ...newExp, status: 'active' }]);
      setAdding(false);
    } catch (e) { setSaveError(e.message); }
    finally     { setSaving(false); }
  };

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete exporter "${exp.exporterID}"?`)) return;
    try {
      await deleteExporter(exp.exporterID, exp.deviceName);
      setExporters(prev => prev.filter(e => !(e.exporterID === exp.exporterID && e.deviceName === exp.deviceName)));
    } catch (e) { alert(`Delete failed: ${e.message}`); }
  };

  const filtered = exporters.filter(e => {
    const s = search.toLowerCase();
    return (e.exporterID || '').toLowerCase().includes(s) ||
           (e.aeTitle    || '').toLowerCase().includes(s) ||
           (e.uri        || '').toLowerCase().includes(s);
  });

  const showTable = !loading && (filtered.length > 0 || adding);

  return (
    <div>
      {/* Queue stats */}
      {taskStats && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          {TASK_STATUSES.map(({ key, label, color }) => (
            <span key={key} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label}
              <span className="font-bold">{taskStats[key] ?? 0}</span>
            </span>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search exporters…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800" />
        <button onClick={load} disabled={loading}
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button onClick={() => { setAdding(true); setNewExp(BLANK_EXP); setSaveError(null); }} disabled={adding}
          className="px-5 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-40 whitespace-nowrap">
          + Add Exporter
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0a6e79]" />
          <p className="mt-4 text-gray-600">Loading Exporters…</p>
        </div>
      ) : !showTable ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">📤</div>
          <p className="text-gray-600">{search ? 'No exporters match your search.' : 'No Exporters configured.'}</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition">
            + Add First Exporter
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">{filtered.length} exporter{filtered.length !== 1 ? 's' : ''}</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a6e79] text-white text-left">
                  {['#','Exporter ID','Device','AE Title','URI','Queue','Storage','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp, idx) => (
                  <tr key={idx} className={`border-t border-gray-100 hover:bg-[#00768308] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#0a6e79]">{exp.exporterID || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-medium">{exp.deviceName || '—'}</td>
                    <td className="px-4 py-3">
                      {exp.aeTitle ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{exp.aeTitle}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {exp.uri ? <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{exp.uri}</code> : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{exp.queueName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{exp.storageID || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(exp.status)}>
                        {(exp.status || 'active').charAt(0).toUpperCase() + (exp.status || 'active').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(exp)}
                        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {adding && (
                  <tr className="border-t-2 border-[#0a6e79] bg-teal-50/60">
                    <td className="px-3 py-2 text-[#0a6e79] font-bold text-xs">NEW</td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="Exporter ID" value={newExp.exporterID}
                        onChange={e => setNewExp(p => ({ ...p, exporterID: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <select className={sel} value={newExp.deviceName}
                        onChange={e => setNewExp(p => ({ ...p, deviceName: e.target.value }))}>
                        <option value="">— Device —</option>
                        {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={sel} value={newExp.aeTitle}
                        onChange={e => setNewExp(p => ({ ...p, aeTitle: e.target.value }))}>
                        <option value="">— AE —</option>
                        {aeTitles.map(ae => <option key={ae} value={ae}>{ae}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="stow-rs:http://…" value={newExp.uri}
                        onChange={e => setNewExp(p => ({ ...p, uri: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="Export1" value={newExp.queueName}
                        onChange={e => setNewExp(p => ({ ...p, queueName: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="Storage ID" value={newExp.storageID}
                        onChange={e => setNewExp(p => ({ ...p, storageID: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button onClick={handleSave} disabled={saving}
                          className="px-3 py-1 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setAdding(false)} disabled={saving}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {saveError && <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-xs">{saveError}</div>}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((exp, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[#0a6e79] text-sm">{exp.exporterID || `Exporter #${idx + 1}`}</span>
                  <span className={statusBadge(exp.status)}>
                    {(exp.status || 'active').charAt(0).toUpperCase() + (exp.status || 'active').slice(1)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex gap-4">
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">Device</span><p className="text-gray-700">{exp.deviceName || '—'}</p></div>
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">AE Title</span><p className="text-gray-700">{exp.aeTitle || '—'}</p></div>
                  </div>
                  {exp.uri && <div><span className="text-gray-500 text-xs uppercase">URI</span><p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-0.5 break-all">{exp.uri}</p></div>}
                  <div className="flex gap-4">
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">Queue</span><p className="text-gray-700">{exp.queueName || '—'}</p></div>
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">Storage</span><p className="text-gray-700">{exp.storageID || '—'}</p></div>
                  </div>
                </div>
                <button onClick={() => handleDelete(exp)}
                  className="mt-3 px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                  Delete
                </button>
              </div>
            ))}

            {adding && (
              <div className="bg-teal-50 border-2 border-[#0a6e79] rounded-xl p-4 space-y-2">
                <span className="font-semibold text-[#0a6e79] text-sm block">New Exporter</span>
                {[
                  { label: 'Exporter ID', key: 'exporterID', ph: 'STOW-RS' },
                  { label: 'URI',         key: 'uri',        ph: 'stow-rs:http://…' },
                  { label: 'Queue Name',  key: 'queueName',  ph: 'Export1' },
                  { label: 'Storage ID',  key: 'storageID',  ph: '' },
                  { label: 'Description', key: 'description',ph: '' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 uppercase font-medium">{label}</label>
                    <input className={`${inp} mt-0.5`} placeholder={ph} value={newExp[key]}
                      onChange={e => setNewExp(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-medium">Device</label>
                  <select className={`${sel} mt-0.5`} value={newExp.deviceName}
                    onChange={e => setNewExp(p => ({ ...p, deviceName: e.target.value }))}>
                    <option value="">— Select Device —</option>
                    {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-medium">AE Title</label>
                  <select className={`${sel} mt-0.5`} value={newExp.aeTitle}
                    onChange={e => setNewExp(p => ({ ...p, aeTitle: e.target.value }))}>
                    <option value="">— Select AE —</option>
                    {aeTitles.map(ae => <option key={ae} value={ae}>{ae}</option>)}
                  </select>
                </div>
                {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setAdding(false)} disabled={saving}
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
  );
}

// ── Export Rules tab ─────────────────────────────────────────────────────────
const BLANK_RULE = { cn: '', description: '', deviceName: '', exporterID: '', entity: 'Study', property: '', priority: '' };
const ENTITIES = ['Study', 'Series', 'Instance', 'MPPS'];

function ExportRulesTab({ aeTitles, deviceNames, exporterIDs }) {
  const [rules,     setRules]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [adding,    setAdding]    = useState(false);
  const [newRule,   setNewRule]   = useState(BLANK_RULE);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try   { setRules(await fetchExportRules()); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete export rule "${rule.cn}"?`)) return;
    try {
      await deleteExportRule(rule.cn);
      setRules(prev => prev.filter(r => r.cn !== rule.cn));
    } catch (e) { alert(`Delete failed: ${e.message}`); }
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      await createExportRule(newRule);
      setRules(prev => [...prev, {
        cn:          newRule.cn || `export-rule-${prev.length + 1}`,
        description: newRule.description,
        deviceName:  newRule.deviceName,
        exporterID:  newRule.exporterID ? newRule.exporterID.split(',').map(s => s.trim()).filter(Boolean) : [],
        entity:      newRule.entity,
        property:    newRule.property ? newRule.property.split(',').map(s => s.trim()).filter(Boolean) : [],
        priority:    newRule.priority ? Number(newRule.priority) : 0,
        status:      'active',
      }]);
      setAdding(false);
    } catch (e) { setSaveError(e.message); }
    finally     { setSaving(false); }
  };

  const filtered = rules.filter(r => {
    const s = search.toLowerCase();
    return (r.cn || '').toLowerCase().includes(s) ||
           formatList(r.exporterID).toLowerCase().includes(s) ||
           (r.entity || '').toLowerCase().includes(s);
  });

  const showTable = !loading && (filtered.length > 0 || adding);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search export rules…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800" />
        <button onClick={load} disabled={loading}
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button onClick={() => { setAdding(true); setNewRule(BLANK_RULE); setSaveError(null); }} disabled={adding}
          className="px-5 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-40 whitespace-nowrap">
          + Add Rule
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0a6e79]" />
          <p className="mt-4 text-gray-600">Loading Export Rules…</p>
        </div>
      ) : !showTable ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-600">{search ? 'No rules match your search.' : 'No Export Rules configured.'}</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition">
            + Add First Rule
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a6e79] text-white text-left">
                  {['#','Name','Device','Exporter IDs','Entity','Property Filter','Priority','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule, idx) => (
                  <tr key={idx} className={`border-t border-gray-100 hover:bg-[#00768308] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#0a6e79]">{rule.cn || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-medium">{rule.deviceName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(rule.exporterID) && rule.exporterID.length
                          ? rule.exporterID.map((id, i) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{id}</span>
                            ))
                          : <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {rule.entity
                        ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">{rule.entity}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatList(rule.property)}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.priority ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(rule.status)}>
                        {(rule.status || 'active').charAt(0).toUpperCase() + (rule.status || 'active').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(rule)}
                        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {adding && (
                  <tr className="border-t-2 border-[#0a6e79] bg-teal-50/60">
                    <td className="px-3 py-2 text-[#0a6e79] font-bold text-xs">NEW</td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="Rule name" value={newRule.cn}
                        onChange={e => setNewRule(p => ({ ...p, cn: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <select className={sel} value={newRule.deviceName}
                        onChange={e => setNewRule(p => ({ ...p, deviceName: e.target.value }))}>
                        <option value="">— Device —</option>
                        {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={sel} value={newRule.exporterID}
                        onChange={e => setNewRule(p => ({ ...p, exporterID: e.target.value }))}>
                        <option value="">— Exporter —</option>
                        {exporterIDs.map(id => <option key={id} value={id}>{id}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={sel} value={newRule.entity}
                        onChange={e => setNewRule(p => ({ ...p, entity: e.target.value }))}>
                        {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className={inp} placeholder="Modality=CT" value={newRule.property}
                        onChange={e => setNewRule(p => ({ ...p, property: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inp} type="number" placeholder="0" value={newRule.priority}
                        onChange={e => setNewRule(p => ({ ...p, priority: e.target.value }))} />
                    </td>
                    <td />
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button onClick={handleSave} disabled={saving}
                          className="px-3 py-1 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setAdding(false)} disabled={saving}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {saveError && <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-xs">{saveError}</div>}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((rule, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[#0a6e79] text-sm">{rule.cn || `Rule #${idx + 1}`}</span>
                  <span className={statusBadge(rule.status)}>
                    {(rule.status || 'active').charAt(0).toUpperCase() + (rule.status || 'active').slice(1)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4">
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">Device</span><p className="text-gray-700">{rule.deviceName || '—'}</p></div>
                    <div className="flex-1"><span className="text-gray-500 text-xs uppercase">Entity</span><p className="text-gray-700">{rule.entity || '—'}</p></div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs uppercase">Exporter IDs</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(rule.exporterID) && rule.exporterID.length
                        ? rule.exporterID.map((id, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{id}</span>
                          ))
                        : <span className="text-gray-400">—</span>}
                    </div>
                  </div>
                  {formatList(rule.property) !== '—' && (
                    <div><span className="text-gray-500 text-xs uppercase">Properties</span><p className="text-gray-600 text-xs">{formatList(rule.property)}</p></div>
                  )}
                </div>
                <button onClick={() => handleDelete(rule)}
                  className="mt-3 px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                  Delete
                </button>
              </div>
            ))}

            {adding && (
              <div className="bg-teal-50 border-2 border-[#0a6e79] rounded-xl p-4 space-y-2">
                <span className="font-semibold text-[#0a6e79] text-sm block">New Export Rule</span>
                {[
                  { label: 'Name (cn)',       key: 'cn',       ph: 'export-rule-1' },
                  { label: 'Description',     key: 'description', ph: '' },
                  { label: 'Property Filter', key: 'property', ph: 'Modality=CT' },
                  { label: 'Priority',        key: 'priority', ph: '0', type: 'number' },
                ].map(({ label, key, ph, type }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 uppercase font-medium">{label}</label>
                    <input type={type || 'text'} placeholder={ph} value={newRule[key]}
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
                  <label className="text-xs text-gray-500 uppercase font-medium">Exporter ID</label>
                  <select className={`${sel} mt-0.5`} value={newRule.exporterID}
                    onChange={e => setNewRule(p => ({ ...p, exporterID: e.target.value }))}>
                    <option value="">— Select Exporter —</option>
                    {exporterIDs.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-medium">Entity</label>
                  <select className={`${sel} mt-0.5`} value={newRule.entity}
                    onChange={e => setNewRule(p => ({ ...p, entity: e.target.value }))}>
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Rule'}
                  </button>
                  <button onClick={() => setAdding(false)} disabled={saving}
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
  );
}

// ── Monitoring tab ────────────────────────────────────────────────────────────
const BLANK_FILTER = {
  exporterID: '', deviceName: '', status: '', studyInstanceUID: '',
  batchID: '', createdTime: '', updatedTime: '',
};
const STATUSES_FILTER = ['', 'SCHEDULED', 'IN PROCESS', 'COMPLETED', 'WARNING', 'FAILED', 'CANCELED'];

function MonitoringTab({ exporterIDs, deviceNames }) {
  const [filters,       setFilters]       = useState(BLANK_FILTER);
  const [limit,         setLimit]         = useState(20);
  const [tasks,         setTasks]         = useState([]);
  const [totalCount,    setTotalCount]    = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [countLoading,  setCountLoading]  = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState(null);
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [interval,      setInterval_]     = useState(10);
  const timerRef = useRef(null);

  const buildFilters = () => ({ ...filters, limit });

  const loadTasks = async () => {
    setLoading(true); setError(null);
    try { setTasks(await fetchExportTaskList(buildFilters())); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  };

  const handleCount = async () => {
    setCountLoading(true); setTotalCount(null);
    try { const r = await countExportTasksFiltered(filters); setTotalCount(r.count ?? 0); }
    catch (e) { setError(e.message); }
    finally   { setCountLoading(false); }
  };

  const handleAction = async (action) => {
    const label = action === 'cancel' ? 'Cancel' : action === 'reschedule' ? 'Reschedule' : 'Delete';
    if (!window.confirm(`${label} all matching tasks?`)) return;
    setActionLoading(true); setError(null);
    try {
      if (action === 'cancel')      await cancelExportTasks(filters);
      else if (action === 'reschedule') await rescheduleExportTasks(filters);
      else if (action === 'delete') await deleteExportTasks(filters);
      await loadTasks();
    } catch (e) { setError(e.message); }
    finally     { setActionLoading(false); }
  };

  // auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = window.setInterval(loadTasks, interval * 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, interval, filters, limit]);

  const statusColor = (s) => {
    if (!s) return 'bg-gray-100 text-gray-500';
    const m = {
      'SCHEDULED': 'bg-blue-100 text-blue-700',
      'IN PROCESS': 'bg-yellow-100 text-yellow-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'WARNING': 'bg-orange-100 text-orange-700',
      'FAILED': 'bg-red-100 text-red-700',
      'CANCELED': 'bg-gray-100 text-gray-500',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  };

  const fmt = (v) => v ? new Date(v).toLocaleString() : '—';

  return (
    <div>
      {/* Filter bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 p-4 bg-[#00768308] border border-gray-200 rounded-xl">
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Exporter ID</label>
          <select className={sel} value={filters.exporterID}
            onChange={e => setFilters(p => ({ ...p, exporterID: e.target.value }))}>
            <option value="">All</option>
            {exporterIDs.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Device Name</label>
          <select className={sel} value={filters.deviceName}
            onChange={e => setFilters(p => ({ ...p, deviceName: e.target.value }))}>
            <option value="">All</option>
            {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Status</label>
          <select className={sel} value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            {STATUSES_FILTER.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Limit</label>
          <select className={sel} value={limit} onChange={e => setLimit(Number(e.target.value))}>
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Study Instance UID</label>
          <input className={inp} placeholder="1.2.840…" value={filters.studyInstanceUID}
            onChange={e => setFilters(p => ({ ...p, studyInstanceUID: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Batch ID</label>
          <input className={inp} placeholder="batch-id" value={filters.batchID}
            onChange={e => setFilters(p => ({ ...p, batchID: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Created Date</label>
          <input type="date" className={inp} value={filters.createdTime}
            onChange={e => setFilters(p => ({ ...p, createdTime: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Updated Date</label>
          <input type="date" className={inp} value={filters.updatedTime}
            onChange={e => setFilters(p => ({ ...p, updatedTime: e.target.value }))} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={handleCount} disabled={countLoading}
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold text-sm transition disabled:opacity-50">
          {countLoading ? 'Counting…' : 'COUNT'}
          {totalCount !== null && !countLoading && <span className="ml-2 text-[#0a6e79] font-bold">{totalCount}</span>}
        </button>
        <button onClick={loadTasks} disabled={loading}
          className="px-5 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold text-sm transition disabled:opacity-50">
          {loading ? 'Loading…' : 'SUBMIT'}
        </button>

        {/* All actions dropdown */}
        <div className="relative group">
          <button disabled={actionLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold text-sm transition disabled:opacity-50 flex items-center gap-1">
            {actionLoading ? 'Working…' : 'All actions'} <i className="fa-solid fa-chevron-down text-xs" />
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] hidden group-hover:block">
            <button onClick={() => handleAction('reschedule')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 rounded-t-xl">
              Reschedule All
            </button>
            <button onClick={() => handleAction('cancel')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-orange-600">
              Cancel All
            </button>
            <button onClick={() => handleAction('delete')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 rounded-b-xl">
              Delete All
            </button>
          </div>
        </div>

        {/* CSV download */}
        <a href={getExportTasksCSVUrl(filters)} download="export-tasks.csv"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold text-sm transition flex items-center gap-1">
          <i className="fa-solid fa-download text-xs" /> CSV
        </a>

        {/* Auto refresh */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Interval:</span>
          <select className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none"
            value={interval} onChange={e => setInterval_(Number(e.target.value))}>
            {[5, 10, 30, 60].map(n => <option key={n} value={n}>{n}s</option>)}
          </select>
          <button onClick={() => setAutoRefresh(p => !p)}
            className={`px-4 py-1.5 rounded-2xl text-sm font-semibold transition flex items-center gap-1 ${
              autoRefresh
                ? 'bg-[#0a6e79] text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}>
            <i className={`fa-solid fa-rotate text-xs ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refreshing' : 'Start Auto Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {/* Task table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0a6e79]" />
          <p className="mt-4 text-gray-600">Loading tasks…</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No tasks found. Adjust filters and press SUBMIT.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0a6e79] text-white text-left">
                  {['#','Exporter ID','Device','Study UID','Instances','Status','Created','Updated','Outcome'].map(h => (
                    <th key={h} className="px-3 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => (
                  <tr key={t.pk || idx} className={`border-t border-gray-100 hover:bg-[#00768308] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold text-[#0a6e79]">{t.exporterID || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{t.deviceName || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[180px] truncate" title={t.studyInstanceUID}>{t.studyInstanceUID || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 text-center">{t.numberOfInstances ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(t.status)}`}>{t.status || '—'}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmt(t.createdTime)}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmt(t.updatedTime)}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate" title={t.outcomeMessage}>{t.outcomeMessage || t.errorMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tasks.map((t, idx) => (
              <div key={t.pk || idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[#0a6e79] text-sm">{t.exporterID || `Task #${idx + 1}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(t.status)}`}>{t.status || '—'}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><span className="text-gray-400 uppercase">Device: </span>{t.deviceName || '—'}</div>
                  <div><span className="text-gray-400 uppercase">Study UID: </span><span className="break-all">{t.studyInstanceUID || '—'}</span></div>
                  <div className="flex gap-4">
                    <span><span className="text-gray-400 uppercase">Instances: </span>{t.numberOfInstances ?? '—'}</span>
                    <span><span className="text-gray-400 uppercase">Created: </span>{fmt(t.createdTime)}</span>
                  </div>
                  {(t.outcomeMessage || t.errorMessage) && (
                    <div><span className="text-gray-400 uppercase">Outcome: </span>{t.outcomeMessage || t.errorMessage}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page shell ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'exporters', label: 'Exporters',     icon: 'fa-solid fa-upload' },
  { id: 'rules',     label: 'Export Rules',  icon: 'fa-solid fa-clipboard-list' },
  { id: 'monitor',   label: 'Monitoring',    icon: 'fa-solid fa-chart-line' },
];

export default function ExportRulesPage() {
  const [tab,         setTab]         = useState('exporters');
  const [aeTitles,    setAeTitles]    = useState([]);
  const [deviceNames, setDeviceNames] = useState([]);
  const [exporterIDs, setExporterIDs] = useState([]);

  useEffect(() => {
    fetchApplicationEntities()
      .then(data => setAeTitles(
        (Array.isArray(data) ? data : []).map(ae =>
          typeof ae === 'string' ? ae : (ae.dicomAETitle || ae.aet || '')
        ).filter(Boolean)
      ))
      .catch(() => {});

    fetchDevices()
      .then(data => setDeviceNames(
        (Array.isArray(data) ? data : []).map(d =>
          typeof d === 'string' ? d : (d.dicomDeviceName || '')
        ).filter(Boolean)
      ))
      .catch(() => {});

    fetchExporters()
      .then(data => setExporterIDs(
        (Array.isArray(data) ? data : []).map(e => e.exporterID).filter(Boolean)
      ))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block shrink-0" />
          <h2 className="text-xl sm:text-2xl mt-2 font-semibold text-gray-800">Export</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 sm:px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-[#0a6e79] text-[#0a6e79]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <i className={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6">
          {tab === 'exporters' && <ExportersTab aeTitles={aeTitles} deviceNames={deviceNames} />}
          {tab === 'rules'     && <ExportRulesTab aeTitles={aeTitles} deviceNames={deviceNames} exporterIDs={exporterIDs} />}
          {tab === 'monitor'   && <MonitoringTab exporterIDs={exporterIDs} deviceNames={deviceNames} />}
        </div>
      </div>
    </div>
  );
}
