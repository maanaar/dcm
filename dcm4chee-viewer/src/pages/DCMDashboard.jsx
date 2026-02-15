import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats, fetchHospitals } from '../services/dcmchee';

// ─── Skeleton pulse block ─────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

// ─── Top stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, loading }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: accent }}>
      <p className="text-sm font-semibold text-slate-500 font-[montserrat]">{label}</p>
      {loading
        ? <Skeleton className="h-9 w-24 mt-1" />
        : <p className="text-3xl font-bold text-slate-800">{value}</p>
      }
      {sub && (
        loading
          ? <Skeleton className="h-3 w-16 mt-1" />
          : <p className="text-xs text-slate-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

// ─── Hospital card skeleton ───────────────────────────────────────────────────
function HospitalCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="h-48 bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_VISIBLE = 12;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm]       = useState('');
  const [typeFilter, setTypeFilter]       = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [showAll, setShowAll]             = useState(false);

  // API state
  const [hospitals, setHospitals]         = useState([]);
  const [apiStats, setApiStats]           = useState(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [hospitalsError, setHospitalsError] = useState(null);
  const [statsError, setStatsError]       = useState(null);

  // ── Fetch hospitals from API ────────────────────────────────────────────────
  useEffect(() => {
    setHospitalsLoading(true);
    fetchHospitals()
      .then(data => setHospitals(data))
      .catch(err  => setHospitalsError(err.message))
      .finally(()  => setHospitalsLoading(false));
  }, []);

  // ── Fetch network-wide stats ────────────────────────────────────────────────
  useEffect(() => {
    setStatsLoading(true);
    fetchDashboardStats()
      .then(data => setApiStats(data))
      .catch(err  => setStatsError(err.message))
      .finally(()  => setStatsLoading(false));
  }, []);

  // ── Per-hospital stats: fetch each hospital’s own dashboard data ────────────────
  const [hospitalStats, setHospitalStats] = useState({});  // { [id]: {totalPatients, totalStudies} }

  useEffect(() => {
    if (!hospitals.length) return;
    // Fetch each hospital’s dashboard in parallel — silently ignore failures
    hospitals.forEach(h => {
      fetch(`${import.meta.env.VITE_API_BASE || 'http://172.16.16.221:8000/api'}/dashboard/hospital/${h.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          setHospitalStats(prev => ({
            ...prev,
            [h.id]: {
              patients: data.totalPatients?.toLocaleString() ?? '—',
              studies:  data.totalStudies?.toLocaleString()  ?? '—',
            },
          }));
        })
        .catch(() => {});
    });
  }, [hospitals]);

  // Merge per-hospital stats into the hospital list
  const hospitalsWithStats = hospitals.map(h => ({
    ...h,
    patients: hospitalStats[h.id]?.patients ?? '—',
    studies:  hospitalStats[h.id]?.studies  ?? '—',
  }));

  // ── Build type options dynamically from fetched hospitals ──────────────────
  const typeOptions = ['all', ...Array.from(new Set(hospitals.map(h => h.type))).sort()];

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filtered = hospitalsWithStats.filter(h => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      h.name.toLowerCase().includes(q) ||
      (h.location || '').toLowerCase().includes(q) ||
      (h.type || '').toLowerCase().includes(q);
    const matchType   = typeFilter   === 'all' || h.type   === typeFilter;
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // ── How many to show ───────────────────────────────────────────────────────
  const visibleHospitals = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount      = filtered.length - DEFAULT_VISIBLE;

  const activeCount      = hospitals.filter(h => h.status === 'active').length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header + KPI cards ────────────────────────────────────── */}
        <div className="mb-6">
          <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

            {/* Title bar */}
            <div className="flex gap-2 px-6 py-3 border-b items-center">
              <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
              <h2 className="text-2xl mt-1 font-semibold font-[montserrat]">Hospital Dashboard</h2>
              {(hospitalsError || statsError) && (
                <span className="ml-auto text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  ⚠️ {hospitalsError || statsError}
                </span>
              )}
            </div>

            {/* KPI row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 px-4 pt-4 pb-2 gap-4">
              <StatCard
                label="Total Hospitals"
                value={hospitalsLoading ? '—' : hospitals.length}
                sub={hospitalsLoading ? null : `${activeCount} Active`}
                accent="#31B6C5"
                loading={hospitalsLoading}
              />
              <StatCard
                label="Total Patients"
                value={apiStats?.totalPatients?.toLocaleString() ?? '—'}
                accent="#1E7586"
                loading={statsLoading}
              />
              <StatCard
                label="Total Studies"
                value={apiStats?.totalStudies?.toLocaleString() ?? '—'}
                accent="#2F545B"
                loading={statsLoading}
              />
            </div>

            {/* KPI row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 px-4 pb-4 gap-4">
              <StatCard
                label="Total Series"
                value={apiStats?.totalSeries?.toLocaleString() ?? '—'}
                sub="Across all studies"
                accent="#31B6C5"
                loading={statsLoading}
              />
              <StatCard
                label="Total Images"
                value={apiStats?.totalInstances?.toLocaleString() ?? '—'}
                sub="DICOM instances"
                accent="#1E7586"
                loading={statsLoading}
              />
              <StatCard
                label="Modality Types"
                value={apiStats?.studiesByModality?.length ?? '—'}
                sub={apiStats?.studiesByModality?.slice(0, 3).map(m => m.modality).join(', ') ?? '—'}
                accent="#2F545B"
                loading={statsLoading}
              />
            </div>

            {/* Search + filters */}
            <div className="flex flex-col md:flex-row gap-3 px-4 pb-4">
              <input
                type="text"
                placeholder="Search by name, location, or type…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#31B6C5] bg-white text-slate-700 text-sm"
              />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#31B6C5] bg-white text-slate-700 text-sm"
              >
                {typeOptions.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? '🏥 All Types' : type}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#31B6C5] bg-white text-slate-700 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">🟢 Active</option>
                <option value="maintenance">🟠 Maintenance</option>
              </select>

              {/* Results badge */}
              {!hospitalsLoading && (
                <div className="flex items-center px-3 py-2 bg-[#00768310] rounded-xl text-sm text-[#0a6e79] font-medium whitespace-nowrap">
                  {showAll ? filtered.length : Math.min(filtered.length, DEFAULT_VISIBLE)}
                  &nbsp;/ {filtered.length} hospitals
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Hospital Cards Grid ───────────────────────────────────── */}
        <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow p-4">

          {hospitalsLoading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <HospitalCardSkeleton key={i} />)}
            </div>
          ) : visibleHospitals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🏥</div>
              <p className="text-slate-500 text-lg font-[montserrat]">
                No hospitals found matching your criteria.
              </p>
              <button
                onClick={() => { setSearchTerm(''); setTypeFilter('all'); setStatusFilter('all'); }}
                className="mt-4 px-5 py-2 bg-[#31B6C5] text-white rounded-xl text-sm font-medium hover:bg-[#1E7586] transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleHospitals.map(hospital => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    statsLoaded={hospital.id in hospitalStats}
                    onClick={() => navigate(`/hospital/${hospital.id}`)}
                  />
                ))}
              </div>

              {/* Show more / show less controls */}
              {filtered.length > DEFAULT_VISIBLE && (
                <div className="mt-6 flex justify-center gap-3">
                  {!showAll ? (
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition shadow"
                    >
                      Show all {filtered.length} hospitals
                      <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">+{hiddenCount}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAll(false)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition"
                    >
                      ↑ Show less
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Hospital Card component ──────────────────────────────────────────────────
function HospitalCard({ hospital, statsLoaded, onClick }) {
  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-[#31B6C5]/30"
      onClick={onClick}
    >
      {/* Image */}
      <div className="h-48 relative overflow-hidden">
        <img
          src={hospital.image}
          alt={hospital.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${
            hospital.status === 'active'
              ? 'bg-emerald-500 text-white'
              : 'bg-orange-500 text-white'
          }`}>
            {hospital.status?.toUpperCase()}
          </span>
        </div>

        {/* Overlay: name + location */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white font-bold text-base drop-shadow font-[montserrat] leading-tight">
            {hospital.name}
          </p>
          <p className="text-white/80 text-xs mt-0.5">📍 {hospital.location}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          {hospital.type}
        </p>

        {/* Live stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Beds',     value: hospital.beds, alwaysReady: true },
            { label: 'Patients', value: statsLoaded ? hospital.patients : null },
            { label: 'Studies',  value: statsLoaded ? hospital.studies : null },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-[#00768310] rounded-lg p-2">
              <p className="text-xs text-slate-500 font-[lato]">{label}</p>
              {value === null
                ? <Skeleton className="h-5 w-10 mx-auto mt-1" />
                : <p className="text-sm font-bold text-slate-800">{value}</p>
              }
            </div>
          ))}
        </div>

        {/* Departments */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 mb-1.5 font-[montserrat] uppercase tracking-wide">
            Departments
          </p>
          <div className="flex flex-wrap gap-1">
            {(hospital.departments || []).slice(0, 3).map((dept, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {dept}
              </span>
            ))}
            {(hospital.departments || []).length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                +{hospital.departments.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Modalities */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 font-[montserrat] uppercase tracking-wide">
            Modalities
          </p>
          <div className="flex flex-wrap gap-1">
            {(hospital.modalities || []).map((m, idx) => (
              <span key={idx} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* View Dashboard CTA */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Click to open dashboard</span>
          <span className="text-xs font-semibold text-[#0a6e79] group-hover:translate-x-1 transition-transform inline-block">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}