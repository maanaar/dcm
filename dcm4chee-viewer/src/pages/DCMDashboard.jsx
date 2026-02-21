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
      <div className="h-20 bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
    </div>
  );
}

const DEFAULT_VISIBLE = 12;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm]   = useState('');
  const [showAll, setShowAll]         = useState(false);

  const [hospitals, setHospitals]           = useState([]);
  const [apiStats, setApiStats]             = useState(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [statsLoading, setStatsLoading]     = useState(true);
  const [hospitalsError, setHospitalsError] = useState(null);
  const [statsError, setStatsError]         = useState(null);

  // ── Fetch hospitals — already contain patientCount, studyCount, modalities ──
  useEffect(() => {
    setHospitalsLoading(true);
    fetchHospitals()
      .then(data => setHospitals(data))
      .catch(err  => setHospitalsError(err.message))
      .finally(()  => setHospitalsLoading(false));
  }, []);

  // ── Fetch network-wide KPI stats ───────────────────────────────────────────
  useEffect(() => {
    setStatsLoading(true);
    fetchDashboardStats()
      .then(data => setApiStats(data))
      .catch(err  => setStatsError(err.message))
      .finally(()  => setStatsLoading(false));
  }, []);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = hospitals.filter(h =>
    (h.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleHospitals = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount      = filtered.length - DEFAULT_VISIBLE;

  // ── Compute totals from hospitals list for the KPI row ────────────────────
  const totalPatientsFromHospitals = hospitals.reduce((s, h) => s + (h.patientCount || 0), 0);
  const totalStudiesFromHospitals  = hospitals.reduce((s, h) => s + (h.studyCount  || 0), 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header + KPI cards ─────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow">

            {/* Title bar */}
            <div className="flex gap-2 px-6 py-3 border-b items-center">
              <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
              <h2 className="text-2xl mt-1 font-semibold font-[montserrat] text-gray-800">
                Network Dashboard
              </h2>
              {(hospitalsError || statsError) && (
                <span className="ml-auto text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  {hospitalsError || statsError}
                </span>
              )}
            </div>

            {/* KPI row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 px-4 pt-4 pb-2 gap-4">
              <StatCard
                label="Total Institutions"
                value={hospitalsLoading ? '—' : hospitals.length}
                sub={hospitalsLoading ? null : `${hospitals.length} Active`}
                accent="#31B6C5"
                loading={hospitalsLoading}
              />
              <StatCard
                label="Total Patients"
                value={hospitalsLoading ? '—' : totalPatientsFromHospitals.toLocaleString()}
                accent="#1E7586"
                loading={hospitalsLoading}
              />
              <StatCard
                label="Total Studies"
                value={hospitalsLoading ? '—' : totalStudiesFromHospitals.toLocaleString()}
                accent="#2F545B"
                loading={hospitalsLoading}
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

            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-3 px-4 pb-4">
              <input
                type="text"
                placeholder="Search institutions…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setShowAll(false); }}
                className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#31B6C5] bg-white text-slate-700 text-sm"
              />
              {!hospitalsLoading && (
                <div className="flex items-center px-3 py-2 bg-[#00768310] rounded-xl text-sm text-[#0a6e79] font-medium whitespace-nowrap">
                  {showAll ? filtered.length : Math.min(filtered.length, DEFAULT_VISIBLE)}
                  &nbsp;/ {filtered.length} institutions
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Institution Cards Grid ─────────────────────────────────────── */}
        <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow p-4">

          {hospitalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <HospitalCardSkeleton key={i} />)}
            </div>
          ) : visibleHospitals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🏥</div>
              <p className="text-slate-500 text-lg font-[montserrat]">
                {searchTerm
                  ? 'No institutions found matching your search.'
                  : 'No institutions found.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-5 py-2 bg-[#31B6C5] text-white rounded-xl text-sm font-medium hover:bg-[#1E7586] transition"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleHospitals.map(hospital => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    onClick={() => navigate(`/hospital/${hospital.id}`)}
                  />
                ))}
              </div>

              {filtered.length > DEFAULT_VISIBLE && (
                <div className="mt-6 flex justify-center gap-3">
                  {!showAll ? (
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl text-sm font-semibold transition shadow"
                    >
                      Show all {filtered.length} institutions
                      <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                        +{hiddenCount}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAll(false)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition"
                    >
                      Show less
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

// ─── Hospital Card ─────────────────────────────────────────────────────────────
// Now receives all data directly from the hospital object — no secondary fetch
function HospitalCard({ hospital, onClick }) {
  const {
    name,
    patientCount = 0,
    studyCount   = 0,
    modalities   = [],
    departments  = [],
    lastStudyDate,
    address,
  } = hospital;

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-[#31B6C5]/30"
      onClick={onClick}
    >
      {/* Gradient header */}
      <div className="h-20 bg-gradient-to-br from-[#0a6e79] to-[#31B6C5] flex items-center px-5 relative">
        <div className="bg-white/20 rounded-full p-3 mr-3 shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-white font-bold text-sm font-[montserrat] leading-tight flex-1 truncate">
          {name}
        </p>
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-400 text-white rounded-full text-xs font-semibold shadow">
          ACTIVE
        </span>
      </div>

      {/* Body */}
      <div className="p-4">

        {/* Address / last study */}
        <p className="text-xs text-slate-400 mb-3 font-medium truncate">
          {address
            ? `📍 ${address}`
            : lastStudyDate
              ? `🗓 Last study: ${lastStudyDate}`
              : 'No additional info'}
        </p>

        {/* Stats grid — data comes directly from grouped studies */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Patients', value: patientCount.toLocaleString() },
            { label: 'Studies',  value: studyCount.toLocaleString()   },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-[#00768310] rounded-lg p-2">
              <p className="text-xs text-slate-500 font-[lato]">{label}</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Modalities — from ModalitiesInStudy aggregation */}
        {modalities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">
              Modalities
            </p>
            <div className="flex flex-wrap gap-1">
              {modalities.map((m, i) => (
                <span
                  key={i}
                  className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-100"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Departments — from InstitutionalDepartmentName aggregation */}
        {departments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">
              Departments
            </p>
            <div className="flex flex-wrap gap-1">
              {departments.slice(0, 3).map((d, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {d}
                </span>
              ))}
              {departments.length > 3 && (
                <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                  +{departments.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Click to open dashboard</span>
          <span className="text-xs font-semibold text-[#0a6e79] group-hover:translate-x-1 transition-transform inline-block">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}