import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, setUserPermissions } from '../services/dcmchee';
import { APP_PERMISSIONS, ALL_PERMISSION_IDS } from '../config/permissions';

// ── shared input style ────────────────────────────────────────────────────────
const inp =
  'w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none ' +
  'focus:ring-1 focus:ring-[#0a6e79] focus:border-[#0a6e79] bg-white placeholder-gray-400';

const BLANK = { username: '', email: '', firstName: '', lastName: '', password: '', isAdmin: false, permissions: [] };

// ── helpers ───────────────────────────────────────────────────────────────────
const enabledBadge = (enabled) =>
  enabled
    ? 'px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium cursor-pointer select-none'
    : 'px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium cursor-pointer select-none';

// Group permissions by section for display
const SECTIONS = [...new Set(APP_PERMISSIONS.map(p => p.section))];

function PermissionCheckboxes({ selected, onChange }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      {SECTIONS.map(section => (
        <div key={section}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{section}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {APP_PERMISSIONS.filter(p => p.section === section).map(perm => (
              <label key={perm.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#0a6e79]"
                  checked={selected.includes(perm.id)}
                  onChange={() => toggle(perm.id)}
                />
                <span className="text-xs text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');

  const [adding,    setAdding]    = useState(false);
  const [newUser,   setNewUser]   = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  // inline permission editor state
  const [editingPerms, setEditingPerms] = useState(null); // user id
  const [pendingPerms, setPendingPerms] = useState([]);
  const [permsSaving,  setPermsSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(await fetchUsers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── toggle enabled ──────────────────────────────────────────────────────────
  const handleToggleEnabled = useCallback(async (user) => {
    const next = !user.enabled;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: next } : u));
    try { await updateUser(user.id, { enabled: next }); }
    catch (e) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: user.enabled } : u));
      alert(`Failed to update: ${e.message}`);
    }
  }, []);

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e) { alert(`Delete failed: ${e.message}`); }
  }, []);

  // ── create ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!newUser.username.trim()) { setSaveError('Username is required.'); return; }
    if (!newUser.password) { setSaveError('Password is required.'); return; }
    setSaving(true); setSaveError(null);
    try {
      await createUser(newUser);
      await load();
      setAdding(false);
      setNewUser(BLANK);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  }, [newUser, load]);

  // ── permission editor ───────────────────────────────────────────────────────
  const openPermEditor = useCallback((user) => {
    setEditingPerms(user.id);
    setPendingPerms(user.permissions || []);
  }, []);

  const handleSavePerms = useCallback(async (userId) => {
    setPermsSaving(true);
    try {
      await setUserPermissions(userId, pendingPerms);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: pendingPerms } : u));
      setEditingPerms(null);
    } catch (e) { alert(`Failed to update permissions: ${e.message}`); }
    finally { setPermsSaving(false); }
  }, [pendingPerms]);

  // ── filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => users.filter(u => {
    const s = search.toLowerCase();
    return (
      (u.username  || '').toLowerCase().includes(s) ||
      (u.email     || '').toLowerCase().includes(s) ||
      (u.firstName || '').toLowerCase().includes(s) ||
      (u.lastName  || '').toLowerCase().includes(s)
    );
  }), [users, search]);

  const showTable = !loading && (filtered.length > 0 || adding);

  // ── permission summary badge ─────────────────────────────────────────────────
  const permSummary = (perms = []) => {
    const count = perms.length;
    if (count === 0) return <span className="text-gray-400 text-xs">No access</span>;
    if (count >= ALL_PERMISSION_IDS.length) return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Full access</span>;
    return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{count} screen{count !== 1 ? 's' : ''}</span>;
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block shrink-0" />
          <div className="mt-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">User Management</h2>
            <p className="text-xs text-gray-500">Manage user accounts and screen access rights</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#00768317] text-gray-800"
            />
            <button onClick={load} disabled={loading}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition disabled:opacity-50 whitespace-nowrap">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={() => { setAdding(true); setNewUser(BLANK); setSaveError(null); }} disabled={adding}
              className="px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition disabled:opacity-40 whitespace-nowrap">
              + Add User
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
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : !showTable ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">👤</div>
              <p className="text-gray-600 text-lg">
                {search ? 'No users match your search.' : 'No users found.'}
              </p>
              <button onClick={() => setAdding(true)}
                className="mt-4 px-6 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-2xl font-semibold transition">
                + Add First User
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-500">
                {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                {adding && <span className="ml-2 text-[#0a6e79] font-medium">• Adding new user…</span>}
              </div>

              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a6e79] text-white text-left">
                      {['#','Username','Name','Email','Status','Access','Actions'].map(h => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, idx) => (
                      <>
                        <tr key={user.id}
                          className={`border-t border-gray-100 hover:bg-[#00768308] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-[#0a6e79]">
                            <div className="flex items-center gap-1.5">
                              {user.username}
                              {user.isAdmin && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase">Admin</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{user.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={enabledBadge(user.enabled)} onClick={() => handleToggleEnabled(user)} title="Click to toggle">
                              {user.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {permSummary(user.permissions)}
                              <button onClick={() => openPermEditor(user)}
                                className="px-2 py-0.5 text-xs bg-[#0a6e79]/10 hover:bg-[#0a6e79]/20 text-[#0a6e79] rounded-full transition">
                                Edit access
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(user)}
                              className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                              Delete
                            </button>
                          </td>
                        </tr>

                        {/* Inline permission editor */}
                        {editingPerms === user.id && (
                          <tr className="border-t border-[#0a6e79]/20 bg-teal-50/60">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#0a6e79]">Screen Access for <em>{user.username}</em></span>
                                <div className="flex gap-2">
                                  <button onClick={() => setPendingPerms(ALL_PERMISSION_IDS)}
                                    className="text-xs text-[#0a6e79] underline">All</button>
                                  <button onClick={() => setPendingPerms([])}
                                    className="text-xs text-gray-500 underline">None</button>
                                </div>
                              </div>
                              <PermissionCheckboxes selected={pendingPerms} onChange={setPendingPerms} />
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => handleSavePerms(user.id)} disabled={permsSaving}
                                  className="px-4 py-1.5 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                  {permsSaving ? 'Saving…' : 'Save Access Rights'}
                                </button>
                                <button onClick={() => setEditingPerms(null)} disabled={permsSaving}
                                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}

                    {/* Inline add row */}
                    {adding && (
                      <tr className="border-t-2 border-[#0a6e79] bg-teal-50/60">
                        <td className="px-3 py-3 text-[#0a6e79] font-bold text-xs">NEW</td>
                        <td className="px-3 py-2">
                          <input className={inp} placeholder="username*" value={newUser.username}
                            onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <input className={inp} placeholder="First" value={newUser.firstName}
                              onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))} />
                            <input className={inp} placeholder="Last" value={newUser.lastName}
                              onChange={e => setNewUser(p => ({ ...p, lastName: e.target.value }))} />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} type="email" placeholder="email" value={newUser.email}
                            onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={inp} type="password" placeholder="password" value={newUser.password}
                            onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                        </td>
                        <td className="px-3 py-3" colSpan={2}>
                          <label className="flex items-center gap-2 mb-2 cursor-pointer w-fit">
                            <input
                              type="checkbox"
                              className="accent-[#0a6e79] w-3.5 h-3.5"
                              checked={newUser.isAdmin}
                              onChange={e => setNewUser(p => ({ ...p, isAdmin: e.target.checked, permissions: e.target.checked ? ALL_PERMISSION_IDS : p.permissions }))}
                            />
                            <span className="text-xs font-semibold text-purple-700">Admin (full access + Users page)</span>
                          </label>
                          {!newUser.isAdmin && (
                            <PermissionCheckboxes
                              selected={newUser.permissions}
                              onChange={perms => setNewUser(p => ({ ...p, permissions: perms }))}
                            />
                          )}
                          {saveError && <p className="text-red-600 text-xs mt-1">{saveError}</p>}
                          <div className="flex gap-2 mt-2">
                            <button onClick={handleSave} disabled={saving}
                              className="px-4 py-1.5 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                              {saving ? '...' : 'Create User'}
                            </button>
                            <button onClick={() => { setAdding(false); setSaveError(null); }} disabled={saving}
                              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="md:hidden space-y-3">
                {filtered.map(user => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#0a6e79] text-sm">{user.username}</span>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase">Admin</span>
                        )}
                      </div>
                      <span className={enabledBadge(user.enabled)} onClick={() => handleToggleEnabled(user)}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {(user.firstName || user.lastName) && (
                        <p className="text-gray-700">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
                      )}
                      {user.email && <p className="text-gray-500 text-xs">{user.email}</p>}
                      <div className="flex items-center gap-2">
                        {permSummary(user.permissions)}
                        <button onClick={() => openPermEditor(user)}
                          className="text-xs text-[#0a6e79] underline underline-offset-2">Edit</button>
                      </div>
                      {/* Mobile permission editor */}
                      {editingPerms === user.id && (
                        <div className="border border-[#0a6e79]/30 rounded-lg p-3 bg-teal-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-[#0a6e79] font-semibold">Screen Access</p>
                            <div className="flex gap-2">
                              <button onClick={() => setPendingPerms(ALL_PERMISSION_IDS)} className="text-xs text-[#0a6e79] underline">All</button>
                              <button onClick={() => setPendingPerms([])} className="text-xs text-gray-500 underline">None</button>
                            </div>
                          </div>
                          <PermissionCheckboxes selected={pendingPerms} onChange={setPendingPerms} />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleSavePerms(user.id)} disabled={permsSaving}
                              className="flex-1 py-1.5 bg-[#0a6e79] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                              {permsSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingPerms(null)}
                              className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => handleDelete(user)}
                        className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Mobile add form */}
                {adding && (
                  <div className="bg-teal-50 border-2 border-[#0a6e79] rounded-xl p-4 space-y-2.5">
                    <p className="font-semibold text-[#0a6e79] text-sm">New User</p>
                    {[
                      { label: 'Username *', key: 'username',  type: 'text',     ph: 'username' },
                      { label: 'First Name', key: 'firstName', type: 'text',     ph: 'First' },
                      { label: 'Last Name',  key: 'lastName',  type: 'text',     ph: 'Last' },
                      { label: 'Email',      key: 'email',     type: 'email',    ph: 'user@example.com' },
                      { label: 'Password',   key: 'password',  type: 'password', ph: '••••••' },
                    ].map(({ label, key, type, ph }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 uppercase font-medium">{label}</label>
                        <input type={type} placeholder={ph} value={newUser[key]}
                          onChange={e => setNewUser(p => ({ ...p, [key]: e.target.value }))}
                          className={`${inp} mt-0.5`} />
                      </div>
                    ))}
                    <div>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer w-fit">
                        <input
                          type="checkbox"
                          className="accent-[#0a6e79] w-3.5 h-3.5"
                          checked={newUser.isAdmin}
                          onChange={e => setNewUser(p => ({ ...p, isAdmin: e.target.checked, permissions: e.target.checked ? ALL_PERMISSION_IDS : p.permissions }))}
                        />
                        <span className="text-xs font-semibold text-purple-700">Admin (full access + Users page)</span>
                      </label>
                      {!newUser.isAdmin && (
                        <>
                          <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Screen Access</label>
                          <PermissionCheckboxes
                            selected={newUser.permissions}
                            onChange={perms => setNewUser(p => ({ ...p, permissions: perms }))}
                          />
                        </>
                      )}
                    </div>
                    {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                        {saving ? 'Saving…' : 'Create User'}
                      </button>
                      <button onClick={() => { setAdding(false); setSaveError(null); }} disabled={saving}
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
