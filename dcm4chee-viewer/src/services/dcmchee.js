/**
 * CuraLink DICOM API Client
 * Connects to FastAPI backend for dcm4chee operations
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// ============================================================================
// HOSPITALS API  ← NEW
// ============================================================================

/**
 * Fetch all hospitals from the registry
 * @returns {Promise<Array>}
 */
export const fetchHospitals = async () => {
  try {
    const response = await fetch(`${API_BASE}/hospitals`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch hospitals: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching hospitals:', error);
    throw error;
  }
};

/**
 * Fetch a single hospital by id
 * @param {number|string} hospitalId
 * @returns {Promise<Object>}
 */
export const fetchHospital = async (hospitalId) => {
  try {
    const response = await fetch(`${API_BASE}/hospitals/${hospitalId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch hospital: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching hospital:', error);
    throw error;
  }
};

// ============================================================================
// PATIENTS API
// ============================================================================

export const searchPatients = async (formData) => {
  try {
    const queryParams = new URLSearchParams();

    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching
        ? `*${formData.patientFamilyName}*`
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }
    if (formData.patientId)           queryParams.append('PatientID', formData.patientId);
    if (formData.issuerOfPatient)     queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    if (formData.patientSex)          queryParams.append('PatientSex', formData.patientSex);
    if (formData.birthDate)           queryParams.append('PatientBirthDate', formData.birthDate.replace(/-/g, ''));
    if (formData.verificationStatus)  queryParams.append('PatientVerificationStatus', formData.verificationStatus);
    if (formData.limitOfPatients)     queryParams.append('limit', formData.limitOfPatients);
    if (formData.orderBy)             queryParams.append('orderby', formData.orderBy);
    if (formData.onlyWithStudies)     queryParams.append('onlyWithStudies', 'true');
    if (formData.mergedPatients)      queryParams.append('merged', 'true');

    const url = `${API_BASE}/patients?${queryParams.toString()}`;
    console.log('🔍 Searching patients:', url);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    return transformPatientData(await response.json());
  } catch (error) {
    console.error('❌ Error searching patients:', error);
    throw error;
  }
};

export const getPatientStudies = async (patientId) => {
  try {
    const url = `${API_BASE}/patients/${patientId}/studies`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch studies: ${response.status} - ${errorText}`);
    }
    return transformStudyData(await response.json());
  } catch (error) {
    console.error('❌ Error fetching patient studies:', error);
    throw error;
  }
};

// ============================================================================
// STUDIES API
// ============================================================================

export const searchStudies = async (formData) => {
  try {
    const queryParams = new URLSearchParams();

    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching
        ? `*${formData.patientFamilyName}*`
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }
    if (formData.patientId)                   queryParams.append('PatientID', formData.patientId);
    if (formData.issuerOfPatient)             queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    if (formData.accessionNumber)             queryParams.append('AccessionNumber', formData.accessionNumber);
    if (formData.issuerOfAccessionNumber)     queryParams.append('IssuerOfAccessionNumberSequence', formData.issuerOfAccessionNumber);
    if (formData.studyDescription)            queryParams.append('StudyDescription', formData.studyDescription);
    if (formData.modality)                    queryParams.append('ModalitiesInStudy', formData.modality);
    if (formData.referringPhysician)          queryParams.append('ReferringPhysicianName', formData.referringPhysician);
    if (formData.institutionalDepartmentName) queryParams.append('InstitutionalDepartmentName', formData.institutionalDepartmentName);
    if (formData.sendingAET)                  queryParams.append('SendingApplicationEntityTitleOfSeries', formData.sendingAET);
    if (formData.studyDate)                   queryParams.append('StudyDate', formData.studyDate.replace(/-/g, ''));
    if (formData.studyTime)                   queryParams.append('StudyTime', formData.studyTime.replace(/:/g, ''));
    if (formData.studyReceived)               queryParams.append('StudyReceiveDateTime', formData.studyReceived.replace(/-/g, ''));
    if (formData.studyAccess)                 queryParams.append('StudyAccessDateTime', formData.studyAccess.replace(/-/g, ''));
    if (formData.limit)                       queryParams.append('limit', formData.limit);
    if (formData.orderBy)                     queryParams.append('orderby', formData.orderBy);

    const url = `${API_BASE}/studies?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }
    return transformStudyData(await response.json());
  } catch (error) {
    console.error('❌ Error searching studies:', error);
    throw error;
  }
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const fetchDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dashboard fetch failed: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    throw error;
  }
};

export const fetchHospitalDashboard = async (hospitalId) => {
  try {
    const response = await fetch(`${API_BASE}/dashboard/hospital/${hospitalId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hospital dashboard fetch failed: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching hospital dashboard:', error);
    throw error;
  }
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

const transformPatientData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((patient, index) => {
    const getValue = (tag, vr = 'Value', idx = 0) => patient[tag]?.[vr]?.[idx] || '';
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts   = patientName.split('^');
    const displayName = nameParts.length > 1 ? `${nameParts[1]} ${nameParts[0]}` : patientName;
    const birthDate   = getValue('00100030');
    const formattedBirthDate = birthDate && birthDate.length === 8
      ? `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`
      : birthDate;
    return {
      id: getValue('00100020') || `patient_${index}`,
      name: displayName || 'Unknown',
      patientId: getValue('00100020'),
      sex: getValue('00100040'),
      birthDate: formattedBirthDate,
      studies: patient.numberOfStudies || 0,
      issuer: getValue('00100021'),
      verificationStatus: getValue('00101024'),
      rawData: patient,
    };
  });
};

const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((study, index) => {
    const getValue = (tag, vr = 'Value', idx = 0) => study[tag]?.[vr]?.[idx] || '';
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts   = patientName.split('^');
    const displayName = nameParts.length > 1 ? `${nameParts[1]} ${nameParts[0]}` : patientName;
    const studyDate   = getValue('00080020');
    const formattedDate = studyDate && studyDate.length === 8
      ? `${studyDate.slice(0, 4)}-${studyDate.slice(4, 6)}-${studyDate.slice(6, 8)}`
      : studyDate;
    const studyTime     = getValue('00080030');
    const formattedTime = studyTime && studyTime.length >= 6
      ? `${studyTime.slice(0, 2)}:${studyTime.slice(2, 4)}:${studyTime.slice(4, 6)}`
      : studyTime;
    return {
      id: getValue('0020000D') || `study_${index}`,
      studyInstanceUID: getValue('0020000D'),
      patientName: displayName || 'Unknown',
      patientId: getValue('00100020'),
      studyDate: formattedDate,
      studyTime: formattedTime,
      modality: getValue('00080061'),
      description: getValue('00081030'),
      accessionNumber: getValue('00080050'),
      referringPhysician: getValue('00080090'),
      numberOfSeries:    study.numberOfStudyRelatedSeries    || getValue('00201206'),
      numberOfInstances: study.numberOfStudyRelatedInstances || getValue('00201208'),
      institutionalDepartmentName: getValue('00081040'),
      rawData: study,
    };
  });
};

// ============================================================================
// MWL API
// ============================================================================

export const searchMWL = async (formData) => {
  try {
    const queryParams = new URLSearchParams();
    if (formData.patientFamilyName) queryParams.append('PatientName', formData.patientFamilyName);
    if (formData.patientId)         queryParams.append('PatientID', formData.patientId);
    if (formData.accessionNumber)   queryParams.append('AccessionNumber', formData.accessionNumber);
    if (formData.issuerOfPatient)   queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    if (formData.modality) {
      queryParams.append('ScheduledProcedureStepSequence.Modality', formData.modality);
    }
    if (formData.scheduledStationAET) {
      queryParams.append('ScheduledProcedureStepSequence.ScheduledStationAETitle', formData.scheduledStationAET);
    }
    if (formData.spsStartTime) {
      queryParams.append(
        'ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime',
        formData.spsStartTime.replace(/:/g, '')
      );
    }
    const response = await fetch(`${API_BASE}/mwl?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`MWL search failed: ${await response.text()}`);
    return await response.json();
  } catch (error) {
    console.error('❌ MWL search error:', error);
    throw error;
  }
};

export const transformMWLData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((item, index) => {
    const getValue = (obj, tag, vr = 'Value', idx = 0) => obj?.[tag]?.[vr]?.[idx] || '';
    const sps = item['00400100']?.Value?.[0] || {};
    return {
      id: index,
      patientName:     getValue(item, '00100010')?.Alphabetic || '',
      patientId:       getValue(item, '00100020'),
      accessionNumber: getValue(item, '00080050'),
      modality:        getValue(sps,  '00080060'),
      spsStartDate:    getValue(sps,  '00400002'),
      spsStartTime:    getValue(sps,  '00400003'),
      stationAET:      getValue(sps,  '00400001'),
      description:     getValue(sps,  '00400007'),
      rawData: item,
    };
  });
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};