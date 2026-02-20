/**
 * CuraLink DICOM API Client
 * Connects to FastAPI backend for dcm4chee operations
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://172.16.16.221:8000/api';

// ============================================================================
// HOSPITALS API
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
    
    // ✅ Web App Service support
    if (formData.webAppService)       queryParams.append('webAppService', formData.webAppService);

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

    // Patient Demographics
    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching
        ? `*${formData.patientFamilyName}*`
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }
    if (formData.patientId) queryParams.append('PatientID', formData.patientId);
    if (formData.issuerOfPatient) queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    
    // Study Identifiers
    if (formData.accessionNumber) queryParams.append('AccessionNumber', formData.accessionNumber);
    if (formData.issuerOfAccessionNumber) queryParams.append('IssuerOfAccessionNumberSequence', formData.issuerOfAccessionNumber);
    
    // Study Details
    if (formData.studyDescription) queryParams.append('StudyDescription', formData.studyDescription);
    if (formData.modality && formData.modality !== 'All') queryParams.append('ModalitiesInStudy', formData.modality);
    if (formData.reportStatus) queryParams.append('CompletionFlag', formData.reportStatus);
    
    // Institutional Information
    if (formData.institutionalName) queryParams.append('InstitutionName', formData.institutionalName);
    if (formData.institutionalDepartmentName) queryParams.append('InstitutionalDepartmentName', formData.institutionalDepartmentName);
    if (formData.referringPhysician) queryParams.append('ReferringPhysicianName', formData.referringPhysician);
    if (formData.sendingAET) queryParams.append('SendingApplicationEntityTitleOfSeries', formData.sendingAET);
    
    // Date/Time Fields
    if (formData.studyDate) queryParams.append('StudyDate', formData.studyDate.replace(/-/g, ''));
    if (formData.studyTime) queryParams.append('StudyTime', formData.studyTime.replace(/:/g, ''));
    if (formData.studyReceived) queryParams.append('StudyReceiveDateTime', formData.studyReceived.replace(/-/g, ''));
    if (formData.studyAccess) queryParams.append('StudyAccessDateTime', formData.studyAccess.replace(/-/g, ''));
    
    // Query Options
    if (formData.limit) queryParams.append('limit', formData.limit);
    if (formData.orderBy) queryParams.append('orderby', formData.orderBy);
    
    // ✅ Web App Service support - NOW FUNCTIONAL
    if (formData.webAppService) queryParams.append('webAppService', formData.webAppService);

    const url = `${API_BASE}/studies?${queryParams.toString()}`;
    console.log('🔍 Searching studies:', url);
    
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
// SERIES API
// ============================================================================

export const searchSeries = async (formData) => {
  try {
    const queryParams = new URLSearchParams();

    // Patient Demographics
    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching
        ? `*${formData.patientFamilyName}*`
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }
    if (formData.patientId) queryParams.append('PatientID', formData.patientId);

    // Study/Series Identifiers
    if (formData.studyInstanceUID) queryParams.append('StudyInstanceUID', formData.studyInstanceUID);
    if (formData.seriesInstanceUID) queryParams.append('SeriesInstanceUID', formData.seriesInstanceUID);
    if (formData.seriesNumber) queryParams.append('SeriesNumber', formData.seriesNumber);

    // Series Details
    if (formData.seriesDescription) queryParams.append('SeriesDescription', formData.seriesDescription);
    if (formData.modality && formData.modality !== 'All') queryParams.append('Modality', formData.modality);
    if (formData.bodyPartExamined) queryParams.append('BodyPartExamined', formData.bodyPartExamined);

    // Performing Physician
    if (formData.performingPhysician) queryParams.append('PerformingPhysicianName', formData.performingPhysician);

    // Date/Time
    if (formData.seriesDate) queryParams.append('SeriesDate', formData.seriesDate.replace(/-/g, ''));
    if (formData.seriesTime) queryParams.append('SeriesTime', formData.seriesTime.replace(/:/g, ''));

    // Query Options
    if (formData.limit) queryParams.append('limit', formData.limit);
    if (formData.orderBy) queryParams.append('orderby', formData.orderBy);
    if (formData.webAppService) queryParams.append('webAppService', formData.webAppService);

    const url = `${API_BASE}/series?${queryParams.toString()}`;
    console.log('🔍 Searching series:', url);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    return transformSeriesData(await response.json());
  } catch (error) {
    console.error('❌ Error searching series:', error);
    throw error;
  }
};

const transformSeriesData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];
  return dicomData.map((series, index) => {
    const getValue = (tag, vr = 'Value', idx = 0) => series[tag]?.[vr]?.[idx] || '';

    const seriesDate = getValue('00080021');
    const formattedDate = seriesDate && seriesDate.length === 8
      ? `${seriesDate.slice(0, 4)}-${seriesDate.slice(4, 6)}-${seriesDate.slice(6, 8)}`
      : seriesDate;

    const seriesTime = getValue('00080031');
    const formattedTime = seriesTime && seriesTime.length >= 6
      ? `${seriesTime.slice(0, 2)}:${seriesTime.slice(2, 4)}:${seriesTime.slice(4, 6)}`
      : seriesTime;

    return {
      id: getValue('0020000E') || `series_${index}`,
      seriesInstanceUID: getValue('0020000E'),
      seriesNumber: getValue('00200011'),
      seriesDescription: getValue('0008103E'),
      modality: getValue('00080060'),
      bodyPartExamined: getValue('00180015'),
      performingPhysician: getValue('00081050'),
      seriesDate: formattedDate,
      seriesTime: formattedTime,
      numberOfInstances: getValue('00201209'),
      studyInstanceUID: getValue('0020000D'),
      rawData: series,
    };
  });
};

// ============================================================================
// DEVICES CONFIGURATION API
// ============================================================================

export const fetchDevices = async () => {
  try {
    const response = await fetch(`${API_BASE}/devices`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch devices: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    throw error;
  }
};

export const fetchDevice = async (deviceName) => {
  try {
    const response = await fetch(`${API_BASE}/devices/${encodeURIComponent(deviceName)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch device: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching device:', error);
    throw error;
  }
};

// ============================================================================
// APPLICATION ENTITIES (AE TITLES) API
// ============================================================================

export const fetchApplicationEntities = async () => {
  try {
    const response = await fetch(`${API_BASE}/aes`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch AEs: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching Application Entities:', error);
    throw error;
  }
};

export const fetchApplicationEntity = async (aet) => {
  try {
    const response = await fetch(`${API_BASE}/aes/${encodeURIComponent(aet)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch AE: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching Application Entity:', error);
    throw error;
  }
};

// ============================================================================
// HL7 APPLICATIONS API
// ============================================================================

export const fetchHL7Applications = async () => {
  try {
    const response = await fetch(`${API_BASE}/hl7apps`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch HL7 apps: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching HL7 Applications:', error);
    throw error;
  }
};

export const fetchHL7Application = async (hl7AppName) => {
  try {
    const response = await fetch(`${API_BASE}/hl7apps/${encodeURIComponent(hl7AppName)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch HL7 app: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching HL7 Application:', error);
    throw error;
  }
};

// ============================================================================
// EXPORT / ROUTING RULES API
// ============================================================================

export const fetchExportRules = async () => {
  try {
    const response = await fetch(`${API_BASE}/export-rules`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch export rules: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching export rules:', error);
    throw error;
  }
};

export const createExportRule = async (ruleData) => {
  try {
    const response = await fetch(`${API_BASE}/export-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create export rule: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error creating export rule:', error);
    throw error;
  }
};

export const deleteExportRule = async (exporterId) => {
  try {
    const response = await fetch(`${API_BASE}/export-rules/${encodeURIComponent(exporterId)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete export rule: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error deleting export rule:', error);
    throw error;
  }
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