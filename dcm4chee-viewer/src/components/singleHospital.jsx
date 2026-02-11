import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchHospital, fetchHospitalDashboard } from '../services/dcmchee';

// ─── Colour palette (teal brand) ─────────────────────────────────────────────
const PALETTE = ['#31B6C5', '#1E7586', '#2F545B', '#0a6e79', '#4DD9E8', '#14A3B8'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, loading }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border-l-4" style={{ borderColor: accent }}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold text-slate-500 font-[montserrat] uppercase tracking-wide">
            {label}
          </p>
          {loading
            ? <Skeleton className="h-8 w-20 mt-2" />
            : <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          }
          {sub && (
            loading
              ? <Skeleton className="h-3 w-14 mt-1" />
              : <p className="text-xs text-slate-400 mt-1">{sub}</p>
          )}
        </div>
        <span className="text-2xl opacity-60 flex-shrink-0">{icon}</span>
      </div>
    </div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Compact Recent Studies ───────────────────────────────────────────────────
function MiniStudiesList({ studies }) {
  if (!studies?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-300">
        <span className="text-3xl mb-2">🗂️</span>
        <p className="text-xs">No recent studies</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {studies.slice(0, 6).map((s, i) => (
        <li
          key={s.id || i}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#00768308] transition-colors"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold
                           flex items-center justify-center leading-none text-center">
            {(s.modality || '?').split(',')[0].trim()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{s.patientName || '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.studyDate || '—'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-[#0a6e79]">{s.numberOfInstances ?? '—'}</p>
            <p className="text-xs text-slate-400">images</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SingleHospitalPage() {
  // Works with both route definitions:
  //   <Route path="/hospital/:id" ... />
  //   <Route path="/hospital/:hospitalId" ... />
  const params     = useParams();
  const navigate   = useNavigate();
  const hospitalId = params.id ?? params.hospitalId;

  const [hospital, setHospital]     = useState(null);
  const [stats,    setStats]        = useState(null);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState(null);
  const [dateRange, setDateRange]   = useState('30d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── Fetch hospital metadata AND dashboard stats in parallel ───────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    setHospital(null);
    setStats(null);

    Promise.all([
      fetchHospital(hospitalId).catch(() => null),       // graceful: may not exist
      fetchHospitalDashboard(hospitalId),
    ])
      .then(([hospitalData, dashboardData]) => {
        setHospital(hospitalData);
        setStats(dashboardData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  // ── Derived chart data ────────────────────────────────────────────────────
  const modality      = stats?.studiesByModality ?? [];
  const dateData      = stats?.studiesByDate     ?? [];
  const recentStudies = stats?.recentStudies     ?? [];

  const radialData = modality.slice(0, 5).map((m, i) => ({
    name:  m.modality,
    value: m.count,
    fill:  PALETTE[i % PALETTE.length],
  }));

  // ── Status pill colour ────────────────────────────────────────────────────
  const statusColor = hospital?.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500';

  return (
    <div className="min-h-screen p-6 font-[montserrat]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header card ──────────────────────────────────────────── */}
        <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">
          <div className="flex justify-between items-center border-b flex-wrap gap-2">
            <div className="flex gap-3 px-6 py-4 items-center">
              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="mr-1 p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                title="Back"
              >
                ←
              </button>
              <img src="/logo-icon.png" width={46} height={46} alt="icon" />
              <div>
                {hospital ? (
                  <>
                    <h2 className="text-xl font-bold leading-tight text-slate-800">
                      {hospital.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      📍 {hospital.location}
                      <span className={`${statusColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {hospital.status?.toUpperCase()}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </>
                )}
              </div>
            </div>

            {/* Date range + filter */}
            <div className="relative mr-6 flex items-center gap-2 flex-wrap">
              {['7d', '30d', '90d'].map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    dateRange === r
                      ? 'bg-[#0a6e79] text-white shadow'
                      : 'bg-[#00768317] text-slate-600 hover:bg-[#00768330]'
                  }`}
                >
                  {r}
                </button>
              ))}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#00768317] px-5 py-2
                             text-sm font-medium text-slate-700 border-2 border-[#0a6e79]
                             hover:border-[#14A3B8] transition"
                >
                  ⚙ Filter
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5">
                    <div className="py-1">
                      {['By Modality', 'By Department', 'By Status', 'By Date'].map(opt => (
                        <button
                          key={opt}
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700
                                     hover:bg-slate-50 rounded-lg"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── KPI row ──────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500 font-medium">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 bg-[#31B6C5] text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
              <StatCard label="Total Studies"   value={stats?.totalStudies?.toLocaleString() ?? '—'} accent="#31B6C5" icon="📋" />
              <StatCard label="Total Patients"  value={stats?.totalPatients?.toLocaleString() ?? '—'} accent="#1E7586" icon="👥" />
              <StatCard label="Total Series"    value={stats?.totalSeries?.toLocaleString() ?? '—'} accent="#2F545B" icon="🗂" />
              <StatCard label="Total Images"    value={stats?.totalInstances?.toLocaleString() ?? '—'} sub="Instances" accent="#0a6e79" icon="🖼" />
              <StatCard label="Modalities"      value={modality.length} sub="Distinct types" accent="#31B6C5" icon="⚕️" />
              <StatCard label="Active Days"     value={dateData.length} sub="With studies" accent="#1E7586" icon="📅" />
            </div>
          )}
        </div>

        {/* ── Charts row 1 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area chart – studies over time */}
          <div className="lg:col-span-2 wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow p-5">
            <h3 className="text-base font-semibold text-slate-700 mb-4">📈 Studies Over Time</h3>
            {loading ? (
              <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
            ) : dateData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dateData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#31B6C5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#31B6C5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    tickFormatter={d => d?.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Studies"
                    stroke="#31B6C5"
                    strokeWidth={2.5}
                    fill="url(#studyGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart – modality split */}
          <div className="wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow p-5">
            <h3 className="text-base font-semibold text-slate-700 mb-4">🥧 Modality Split</h3>
            {loading ? (
              <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
            ) : modality.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={modality}
                    dataKey="count"
                    nameKey="modality"
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85}
                    paddingAngle={3} strokeWidth={0}
                  >
                    {modality.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Charts row 2 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar chart */}
          <div className="wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow p-5">
            <h3 className="text-base font-semibold text-slate-700 mb-4">📊 Studies by Modality</h3>
            {loading ? (
              <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
            ) : modality.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modality} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis dataKey="modality" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Studies" radius={[6, 6, 0, 0]}>
                    {modality.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Radial bar */}
          <div className="wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow p-5">
            <h3 className="text-base font-semibold text-slate-700 mb-4">🎯 Top Modalities (Radial)</h3>
            {loading ? (
              <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
            ) : radialData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="15%" outerRadius="90%"
                  data={radialData}
                  startAngle={180} endAngle={-180}
                >
                  <RadialBar
                    minAngle={15}
                    dataKey="value"
                    cornerRadius={6}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                  />
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Hospital info card + Recent studies ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Hospital info card */}
          <div className="wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow overflow-hidden">
            {/* Image */}
            <div className="relative h-52">
              {hospital?.image ? (
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a6e79cc] to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <p className="text-lg font-bold drop-shadow">
                  {hospital?.name ?? <Skeleton className="h-5 w-40" />}
                </p>
                <p className="text-xs opacity-80">
                  📍 {hospital?.location ?? '—'}
                </p>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Beds',        value: hospital?.beds       ?? '—', icon: '🛏' },
                { label: 'Departments', value: hospital?.departments?.length ?? '—', icon: '🏥' },
                { label: 'Staff',       value: hospital?.staff      ?? '—', icon: '👨‍⚕️' },
              ].map(item => (
                <div key={item.label} className="text-center bg-[#00768310] rounded-xl p-3">
                  <div className="text-lg">{item.icon}</div>
                  <p className="text-base font-bold text-slate-800">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Modalities list */}
            {hospital?.modalities?.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  Available Modalities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hospital.modalities.map((m, i) => (
                    <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Departments list */}
            {hospital?.departments?.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  Departments
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hospital.departments.map((d, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent studies */}
          <div className="wallpaper-page bg-white/70 rounded-2xl backdrop-blur-md border shadow flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-slate-700">🗂 Recent Studies</h3>
              <span className="text-xs bg-[#00768317] text-[#0a6e79] font-medium px-2.5 py-0.5 rounded-full">
                {loading ? '…' : `${recentStudies.length} records`}
              </span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2.5 flex-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <MiniStudiesList studies={recentStudies} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}