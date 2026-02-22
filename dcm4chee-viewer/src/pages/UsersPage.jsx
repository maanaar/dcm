import { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, setUserRoles, fetchRoles } from '../services/dcmchee';

// ── shared input styles ───────────────────────────────────────────────────────
const inp =
  'w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none ' +
  'focus:ring-1 focus:ring-[#0a6e79] focus:border-[#0a6e79] bg-white placeholder-gray-400';

const BLANK = { username: '', email: '', firstName: '', lastName: '', password: '', roles: [] };

// ── helpers ───────────────────────────────────────────────────────────────────
const isAdminRole = (name) => name.toLowerCase().includes('admin');

const enabledBadge = (enabled) =>
  enabled
    ? 'px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium cursor-pointer select-none'
    : 'px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium cursor-pointer select-none';

const roleBadge = (name) =>
  isAdminRole(name)
    ? 'px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium'
    : 'px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium';

// ── component ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [allRoles,  setAllRoles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');

  const [adding,    setAdding]    = useState(false);
  const [newUser,   setNewUser]   = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  // inline role editor
  const [editingRoles, setEditingRoles] = useState(null); // user id
  const [pendingRoles, setPendingRoles] = useState([]);
  const [rolesSaving,  setRolesSaving]  = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(Array.isArray(u) ? u : []);
      setAllRoles(Array.isArray(r) ? r : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── toggle enabled ──────────────────────────────────────────────────────────
  const handleToggleEnabled = async (user) => {
    const next = !user.enabled;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: next } : u));
    try {
      await updateUser(user.id, { enabled: next });
    } catch (e) {
      // revert on failure
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: user.enabled } : u));
      alert(`Failed to update user: ${e.message}`);
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e) { alert(`Delete failed: ${e.message}`); }
  };

  // ── create ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!newUser.username.trim()) { setSaveError('Username is required.'); return; }
    setSaving(true); setSaveError(null);
    try {
      const res = await createUser(newUser);
      // Optimistic add — reload to get server-populated fields
      await load();
      setAdding(false);
      setNewUser(BLANK);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  // ── role editor ─────────────────────────────────────────────────────────────
  const openRoleEditor = (user) => {
    setEditingRoles(user.id);
    setPendingRoles(user.roles || []);
  };

  const togglePendingRole = (roleName) => {
    setPendingRoles(prev =>
      prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName]
    );
  };

  const handleSaveRoles = async (userId) => {
    setRolesSaving(true);
    try {
      await setUserRoles(userId, pendingRoles);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: pendingRoles } : u));
      setEditingRoles(null);
    } catch (e) { alert(`Failed to update roles: ${e.message}`); }
    finally { setRolesSaving(false); }
  };

  // ── filter ──────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (
      (u.username   || '').toLowerCase().includes(s) ||
      (u.email      || '').toLowerCase().includes(s) ||
      (u.firstName  || '').toLowerCase().includes(s) ||
      (u.lastName   || '').toLowerCase().includes(s)
    );
  });

  const showTable = !loading && (filtered.length > 0 || adding);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

        {/* Header */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b">
          <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block shrink-0" />
          <div className="mt-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">User Management</h2>
            <p className="text-xs text-gray-500">Manage Keycloak user accounts and access rights</p>
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
                      {['#', 'Username', 'Name', 'Email', 'Status', 'Roles', 'Actions'].map(h => (
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
                          <td className="px-4 py-3 font-semibold text-[#0a6e79]">{user.username || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{user.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={enabledBadge(user.enabled)} onClick={() => handleToggleEnabled(user)}
                              title="Click to toggle">
                              {user.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 items-center">
                              {(user.roles || []).length
                                ? (user.roles || []).map(r => (
                                    <span key={r} className={roleBadge(r)}>{r}</span>
                                  ))
                                : <span className="text-gray-400 text-xs">—</span>}
                              <button onClick={() => openRoleEditor(user)}
                                className="ml-1 px-2 py-0.5 text-xs bg-[#0a6e79]/10 hover:bg-[#0a6e79]/20 text-[#0a6e79] rounded-full transition">
                                Edit
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

                        {/* Inline role editor row */}
                        {editingRoles === user.id && (
                          <tr className="border-t border-[#0a6e79]/20 bg-teal-50/60">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-[#0a6e79] mr-2">Roles:</span>
                                {allRoles.map(role => (
                                  <label key={role.name} className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" className="accent-[#0a6e79]"
                                      checked={pendingRoles.includes(role.name)}
                                      onChange={() => togglePendingRole(role.name)} />
                                    <span className={`text-xs ${isAdminRole(role.name) ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                      {role.name}
                                    </span>
                                  </label>
                                ))}
                                <button onClick={() => handleSaveRoles(user.id)} disabled={rolesSaving}
                                  className="ml-2 px-3 py-1 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                  {rolesSaving ? '…' : 'Save'}
                                </button>
                                <button onClick={() => setEditingRoles(null)} disabled={rolesSaving}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition">
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
                            <input className={inp} placeholder="First name" value={newUser.firstName}
                              onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))} />
                            <input className={inp} placeholder="Last name" value={newUser.lastName}
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
                        {/* Roles checkboxes */}
                        <td className="px-3 py-2" colSpan={1}>
                          <div className="flex flex-wrap gap-1.5">
                            {allRoles.map(role => (
                              <label key={role.name} className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" className="accent-[#0a6e79]"
                                  checked={newUser.roles.includes(role.name)}
                                  onChange={() => setNewUser(p => ({
                                    ...p,
                                    roles: p.roles.includes(role.name)
                                      ? p.roles.filter(r => r !== role.name)
                                      : [...p.roles, role.name],
                                  }))} />
                                <span className={`text-xs ${isAdminRole(role.name) ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                  {role.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <button onClick={handleSave} disabled={saving}
                              className="px-3 py-1 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                              {saving ? '...' : 'Save'}
                            </button>
                            <button onClick={() => { setAdding(false); setSaveError(null); }} disabled={saving}
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

              {/* ── Mobile Cards ── */}
              <div className="md:hidden space-y-3">
                {filtered.map((user, idx) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[#0a6e79] text-sm">{user.username}</span>
                      <span className={enabledBadge(user.enabled)} onClick={() => handleToggleEnabled(user)}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {(user.firstName || user.lastName) && (
                        <p className="text-gray-700">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
                      )}
                      {user.email && <p className="text-gray-500 text-xs">{user.email}</p>}
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-medium">Roles</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(user.roles || []).length
                            ? (user.roles || []).map(r => (
                                <span key={r} className={roleBadge(r)}>{r}</span>
                              ))
                            : <span className="text-gray-400 text-xs">No roles</span>}
                        </div>
                      </div>
                      {/* Mobile role editor */}
                      {editingRoles === user.id ? (
                        <div className="border border-[#0a6e79]/30 rounded-lg p-2 bg-teal-50/50">
                          <p className="text-xs text-[#0a6e79] font-semibold mb-1.5">Edit Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {allRoles.map(role => (
                              <label key={role.name} className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" className="accent-[#0a6e79]"
                                  checked={pendingRoles.includes(role.name)}
                                  onChange={() => togglePendingRole(role.name)} />
                                <span className={`text-xs ${isAdminRole(role.name) ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                  {role.name}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleSaveRoles(user.id)} disabled={rolesSaving}
                              className="flex-1 py-1.5 bg-[#0a6e79] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                              {rolesSaving ? 'Saving…' : 'Save Roles'}
                            </button>
                            <button onClick={() => setEditingRoles(null)}
                              className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => openRoleEditor(user)}
                          className="text-xs text-[#0a6e79] underline underline-offset-2">
                          Edit roles
                        </button>
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
                      { label: 'Username *',  key: 'username',  ph: 'username',  type: 'text' },
                      { label: 'First Name',  key: 'firstName', ph: 'First',     type: 'text' },
                      { label: 'Last Name',   key: 'lastName',  ph: 'Last',      type: 'text' },
                      { label: 'Email',       key: 'email',     ph: 'user@example.com', type: 'email' },
                      { label: 'Password',    key: 'password',  ph: '••••••',    type: 'password' },
                    ].map(({ label, key, ph, type }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 uppercase font-medium">{label}</label>
                        <input type={type} placeholder={ph} value={newUser[key]}
                          onChange={e => setNewUser(p => ({ ...p, [key]: e.target.value }))}
                          className={`${inp} mt-0.5`} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Roles</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {allRoles.map(role => (
                          <label key={role.name} className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="accent-[#0a6e79]"
                              checked={newUser.roles.includes(role.name)}
                              onChange={() => setNewUser(p => ({
                                ...p,
                                roles: p.roles.includes(role.name)
                                  ? p.roles.filter(r => r !== role.name)
                                  : [...p.roles, role.name],
                              }))} />
                            <span className={`text-xs ${isAdminRole(role.name) ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                              {role.name}
                            </span>
                          </label>
                        ))}
                      </div>
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
