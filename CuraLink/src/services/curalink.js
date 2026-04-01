/**
 * CuraLink DICOM API Client
 * Connects to FastAPI backend for CuraLink operations
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://172.16.16.221:8000/api';

// ── Core fetch helper ─────────────────────────────────────────────────────────

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }
  return response.json();
};

const apiPost = (url, body) => apiFetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const apiPut = (url, body) => apiFetch(url, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const apiDelete = (url) => apiFetch(url, { method: 'DELETE' });


// ── DICOM date/time formatters ────────────────────────────────────────────────

const fmtDate = (raw) =>
  raw && raw.length === 8
    ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
    : raw;

const fmtTime = (raw) =>
  raw && raw.length >= 6
    ? `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4, 6)}`
    : raw;

const dicomName = (tag) => {
  const nv = tag?.Value?.[0];
  if (!nv) return '';
  const parts = (typeof nv === 'object' ? nv.Alphabetic || '' : String(nv)).split('^');
  return parts.length > 1 ? `${parts[1]} ${parts[0]}` : parts[0];
};


// ── Query param builders ──────────────────────────────────────────────────────

const buildPatientParams = (fd) => {
  const p = new URLSearchParams();
  if (fd.patientFamilyName) p.append('PatientName', fd.fuzzyMatching ? `*${fd.patientFamilyName}*` : fd.patientFamilyName);
  if (fd.patientId)          p.append('PatientID',              fd.patientId);
  if (fd.issuerOfPatient)    p.append('IssuerOfPatientID',      fd.issuerOfPatient);
  if (fd.patientSex)         p.append('PatientSex',             fd.patientSex);
  if (fd.birthDate)          p.append('PatientBirthDate',       fd.birthDate.replace(/-/g, ''));
  if (fd.verificationStatus) p.append('PatientVerificationStatus', fd.verificationStatus);
  if (fd.limitOfPatients)    p.append('limit',                  fd.limitOfPatients);
  if (fd.orderBy)            p.append('orderby',                fd.orderBy);
  if (fd.onlyWithStudies)    p.append('onlyWithStudies',        'true');
  if (fd.mergedPatients)     p.append('merged',                 'true');
  if (fd.webAppService)      p.append('webAppService',          fd.webAppService);
  return p;
};

const buildStudyParams = (fd) => {
  const p = new URLSearchParams();
  if (fd.patientFamilyName)             p.append('PatientName',                     fd.fuzzyMatching ? `*${fd.patientFamilyName}*` : fd.patientFamilyName);
  if (fd.patientId)                     p.append('PatientID',                       fd.patientId);
  if (fd.issuerOfPatient)               p.append('IssuerOfPatientID',               fd.issuerOfPatient);
  if (fd.accessionNumber)               p.append('AccessionNumber',                 fd.accessionNumber);
  if (fd.issuerOfAccessionNumber)       p.append('IssuerOfAccessionNumberSequence', fd.issuerOfAccessionNumber);
  if (fd.studyDescription)              p.append('StudyDescription',                fd.studyDescription);
  if (fd.modality && fd.modality !== 'All') p.append('ModalitiesInStudy',           fd.modality);
  if (fd.reportStatus)                  p.append('CompletionFlag',                  fd.reportStatus);
  if (fd.institutionalName)             p.append('InstitutionName',                 fd.institutionalName);
  if (fd.institutionalDepartmentName)   p.append('InstitutionalDepartmentName',     fd.institutionalDepartmentName);
  if (fd.referringPhysician)            p.append('ReferringPhysicianName',          fd.referringPhysician);
  if (fd.sendingAET)                    p.append('SendingApplicationEntityTitleOfSeries', fd.sendingAET);
  if (fd.studyDate)                     p.append('StudyDate',       fd.studyDate.replace(/-/g, ''));
  if (fd.studyTime)                     p.append('StudyTime',       fd.studyTime.replace(/:/g, ''));
  if (fd.studyReceived)                 p.append('StudyReceiveDateTime', fd.studyReceived.replace(/-/g, ''));
  if (fd.studyAccess)                   p.append('StudyAccessDateTime',  fd.studyAccess.replace(/-/g, ''));
  if (fd.limit)                         p.append('limit',    fd.limit);
  if (fd.orderBy)                       p.append('orderby',  fd.orderBy);
  if (fd.webAppService)                 p.append('webAppService', fd.webAppService);
  return p;
};

const buildSeriesParams = (fd) => {
  const p = new URLSearchParams();
  if (fd.patientFamilyName) p.append('PatientName', fd.fuzzyMatching ? `*${fd.patientFamilyName}*` : fd.patientFamilyName);
  if (fd.patientId)          p.append('PatientID',              fd.patientId);
  if (fd.studyInstanceUID)   p.append('StudyInstanceUID',       fd.studyInstanceUID);
  if (fd.seriesInstanceUID)  p.append('SeriesInstanceUID',      fd.seriesInstanceUID);
  if (fd.seriesNumber)       p.append('SeriesNumber',           fd.seriesNumber);
  if (fd.seriesDescription)  p.append('SeriesDescription',      fd.seriesDescription);
  if (fd.modality && fd.modality !== 'All') p.append('Modality', fd.modality);
  if (fd.bodyPartExamined)   p.append('BodyPartExamined',       fd.bodyPartExamined);
  if (fd.performingPhysician) p.append('PerformingPhysicianName', fd.performingPhysician);
  if (fd.seriesDate)         p.append('SeriesDate', fd.seriesDate.replace(/-/g, ''));
  if (fd.seriesTime)         p.append('SeriesTime', fd.seriesTime.replace(/:/g, ''));
  if (fd.limit)              p.append('limit',       fd.limit);
  if (fd.orderBy)            p.append('orderby',     fd.orderBy);
  if (fd.webAppService)      p.append('webAppService', fd.webAppService);
  return p;
};


// ── Data transformers ─────────────────────────────────────────────────────────

const transformPatientData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((patient, index) => {
    const gv = (tag) => patient[tag]?.Value?.[0] || '';
    const birthDate = gv('00100030');
    return {
      id:                 gv('00100020') || `patient_${index}`,
      name:               dicomName(patient['00100010']) || 'Unknown',
      patientId:          gv('00100020'),
      sex:                gv('00100040'),
      birthDate:          fmtDate(birthDate),
      studies:            patient.numberOfStudies || 0,
      issuer:             gv('00100021'),
      verificationStatus: gv('00101024'),
      rawData:            patient,
    };
  });
};

const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((study, index) => {
    const gv = (tag) => study[tag]?.Value?.[0] || '';
    return {
      id:                          gv('0020000D') || `study_${index}`,
      studyInstanceUID:             gv('0020000D'),
      patientName:                  dicomName(study['00100010']) || 'Unknown',
      patientId:                    gv('00100020'),
      studyDate:                    fmtDate(gv('00080020')),
      studyTime:                    fmtTime(gv('00080030')),
      modality:                     gv('00080061'),
      description:                  gv('00081030'),
      accessionNumber:              gv('00080050'),
      referringPhysician:           gv('00080090'),
      numberOfSeries:               study.numberOfStudyRelatedSeries    || gv('00201206'),
      numberOfInstances:            study.numberOfStudyRelatedInstances || gv('00201208'),
      institutionalDepartmentName:  gv('00081040'),
      rawData:                      study,
    };
  });
};

const transformSeriesData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((series, index) => {
    const gv = (tag) => series[tag]?.Value?.[0] || '';
    return {
      id:                  gv('0020000E') || `series_${index}`,
      seriesInstanceUID:   gv('0020000E'),
      seriesNumber:        gv('00200011'),
      seriesDescription:   gv('0008103E'),
      modality:            gv('00080060'),
      bodyPartExamined:    gv('00180015'),
      performingPhysician: gv('00081050'),
      seriesDate:          fmtDate(gv('00080021')),
      seriesTime:          fmtTime(gv('00080031')),
      numberOfInstances:   gv('00201209'),
      studyInstanceUID:    gv('0020000D'),
      rawData:             series,
    };
  });
};

export const transformMWLData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((item, index) => {
    const gv  = (obj, tag) => obj?.[tag]?.Value?.[0] || '';
    const sps = item['00400100']?.Value?.[0] || {};
    return {
      id:              index,
      patientName:     item['00100010']?.Value?.[0]?.Alphabetic || '',
      patientId:       gv(item, '00100020'),
      accessionNumber: gv(item, '00080050'),
      modality:        gv(sps,  '00080060'),
      spsStartDate:    gv(sps,  '00400002'),
      spsStartTime:    gv(sps,  '00400003'),
      stationAET:      gv(sps,  '00400001'),
      description:     gv(sps,  '00400007'),
      rawData:         item,
    };
  });
};


// ============================================================================
// HOSPITALS
// ============================================================================

export const fetchHospitals = () => apiFetch(`${API_BASE}/hospitals`);

export const fetchHospital = (hospitalId) => apiFetch(`${API_BASE}/hospitals/${hospitalId}`);


// ============================================================================
// PATIENTS
// ============================================================================

export const searchPatients = async (formData) => {
  const url = `${API_BASE}/patients?${buildPatientParams(formData)}`;
  console.log('🔍 Searching patients:', url);
  return transformPatientData(await apiFetch(url));
};

export const getPatientStudies = async (patientId) =>
  transformStudyData(await apiFetch(`${API_BASE}/patients/${patientId}/studies`));


// ============================================================================
// STUDIES
// ============================================================================

export const searchStudies = async (formData) => {
  const url = `${API_BASE}/studies?${buildStudyParams(formData)}`;
  console.log('🔍 Searching studies:', url);
  return transformStudyData(await apiFetch(url));
};


// ============================================================================
// DASHBOARD
// ============================================================================

export const fetchDashboardStats = () => apiFetch(`${API_BASE}/dashboard`);

export const fetchHospitalDashboard = (hospitalId) =>
  apiFetch(`${API_BASE}/dashboard/hospital/${hospitalId}`);


// ============================================================================
// MWL
// ============================================================================

export const searchMWL = async (formData) => {
  const p = new URLSearchParams();
  if (formData.patientFamilyName) p.append('PatientName', formData.patientFamilyName);
  if (formData.patientId)         p.append('PatientID',          formData.patientId);
  if (formData.accessionNumber)   p.append('AccessionNumber',    formData.accessionNumber);
  if (formData.issuerOfPatient)   p.append('IssuerOfPatientID',  formData.issuerOfPatient);
  if (formData.modality)          p.append('ScheduledProcedureStepSequence.Modality', formData.modality);
  if (formData.scheduledStationAET) p.append('ScheduledProcedureStepSequence.ScheduledStationAETitle', formData.scheduledStationAET);
  if (formData.spsStartTime)      p.append('ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime', formData.spsStartTime.replace(/:/g, ''));
  return apiFetch(`${API_BASE}/mwl?${p}`);
};


// ============================================================================
// SERIES
// ============================================================================

export const searchSeries = async (formData) => {
  const url = `${API_BASE}/series?${buildSeriesParams(formData)}`;
  console.log('🔍 Searching series:', url);
  return transformSeriesData(await apiFetch(url));
};


// ============================================================================
// DEVICES
// ============================================================================

export const fetchDevices = () => apiFetch(`${API_BASE}/devices`);

export const fetchDevice = (deviceName) =>
  apiFetch(`${API_BASE}/devices/${encodeURIComponent(deviceName)}`);


// ============================================================================
// APPLICATION ENTITIES (AE TITLES)
// ============================================================================

export const fetchApplicationEntities = () => apiFetch(`${API_BASE}/aes`);

export const fetchApplicationEntity = (aet) =>
  apiFetch(`${API_BASE}/aes/${encodeURIComponent(aet)}`);


// ============================================================================
// HL7 APPLICATIONS
// ============================================================================

export const fetchHL7Applications = () => apiFetch(`${API_BASE}/hl7apps`);

export const fetchHL7Application = (name) =>
  apiFetch(`${API_BASE}/hl7apps/${encodeURIComponent(name)}`);


// ============================================================================
// ROUTING RULES
// ============================================================================

export const fetchRoutingRules  = () => apiFetch(`${API_BASE}/routing-rules`);
export const createRoutingRule  = (data) => apiPost(`${API_BASE}/routing-rules`, data);

// ============================================================================
// TRANSFORM RULES
// ============================================================================

export const fetchTransformRules = () => apiFetch(`${API_BASE}/transform-rules`);
export const createTransformRule = (data) => apiPost(`${API_BASE}/transform-rules`, data);


// ============================================================================
// EXPORT RULES
// ============================================================================

export const fetchExportRules  = () => apiFetch(`${API_BASE}/export-rules`);
export const createExportRule  = (data) => apiPost(`${API_BASE}/export-rules`, data);
export const deleteExportRule  = (cn, deviceName) => {
  const url = deviceName
    ? `${API_BASE}/export-rules/${encodeURIComponent(cn)}?deviceName=${encodeURIComponent(deviceName)}`
    : `${API_BASE}/export-rules/${encodeURIComponent(cn)}`;
  return apiDelete(url);
};


// ============================================================================
// WEB APPS / ARCHIVES
// ============================================================================

export const fetchWebApps = async () => {
  try {
    return await apiFetch(`${API_BASE}/webapps`);
  } catch {
    return [{ webAppName: 'dcm4chee-arc', description: 'DCM4CHEE Archive 5.x' }];
  }
};

export const fetchArchives = async () => {
  try {
    return await apiFetch(`${API_BASE}/archives`);
  } catch {
    return [];
  }
};


// ============================================================================
// EXPORTERS
// ============================================================================

export const fetchExporters  = async () => {
  try { return await apiFetch(`${API_BASE}/exporters`); }
  catch { return []; }
};

export const createExporter  = (data) => apiPost(`${API_BASE}/exporters`, data);

export const deleteExporter  = (exporterID, deviceName) => {
  const url = deviceName
    ? `${API_BASE}/exporters/${encodeURIComponent(exporterID)}?deviceName=${encodeURIComponent(deviceName)}`
    : `${API_BASE}/exporters/${encodeURIComponent(exporterID)}`;
  return apiDelete(url);
};


// ============================================================================
// EXPORT TASKS
// ============================================================================

export const fetchExportTasks = async () => {
  try { return await apiFetch(`${API_BASE}/export-tasks`); }
  catch { return { SCHEDULED: 0, 'IN PROCESS': 0, COMPLETED: 0, WARNING: 0, FAILED: 0, CANCELED: 0 }; }
};

const buildTaskParams = (filters) => {
  const p = new URLSearchParams();
  if (filters.exporterID)       p.append('exporterID',       filters.exporterID);
  if (filters.deviceName)       p.append('deviceName',        filters.deviceName);
  if (filters.status)           p.append('status',            filters.status);
  if (filters.studyInstanceUID) p.append('studyInstanceUID',  filters.studyInstanceUID);
  if (filters.batchID)          p.append('batchID',           filters.batchID);
  if (filters.createdTime)      p.append('createdTime',       filters.createdTime);
  if (filters.updatedTime)      p.append('updatedTime',       filters.updatedTime);
  return p;
};

export const fetchExportTaskList = async (filters = {}) => {
  try {
    const p = buildTaskParams(filters);
    p.append('limit',  filters.limit  || 20);
    p.append('offset', filters.offset || 0);
    return await apiFetch(`${API_BASE}/export-tasks/list?${p}`);
  } catch { return []; }
};

export const countExportTasksFiltered = (filters = {}) =>
  apiFetch(`${API_BASE}/export-tasks/count?${buildTaskParams(filters)}`);

export const cancelExportTasks     = (filters = {}) => apiPost(`${API_BASE}/export-tasks/cancel`, filters);
export const rescheduleExportTasks = (filters = {}) => apiPost(`${API_BASE}/export-tasks/reschedule`, filters);

export const deleteExportTasks = (filters = {}) =>
  apiDelete(`${API_BASE}/export-tasks?${buildTaskParams(filters)}`);

export const getExportTasksCSVUrl = (filters = {}) =>
  `${API_BASE}/export-tasks/csv?${buildTaskParams(filters)}`;


// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
};

export const fetchUsers  = async () => {
  try { return await apiFetch(`${API_BASE}/users`); }
  catch { return []; }
};

export const fetchUser   = async (id) => {
  try { return await apiFetch(`${API_BASE}/users/${encodeURIComponent(id)}`); }
  catch { return null; }
};

export const createUser          = (data) => apiPost(`${API_BASE}/users`, data);
export const updateUser          = (id, data) => apiPut(`${API_BASE}/users/${encodeURIComponent(id)}`, data);
export const deleteUser          = (id) => apiDelete(`${API_BASE}/users/${encodeURIComponent(id)}`);
export const setUserPermissions  = (id, permissions) => apiPut(`${API_BASE}/users/${encodeURIComponent(id)}`, { permissions });


