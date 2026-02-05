/**
 * CuraLink DICOM API Client
 * Connects to FastAPI backend for dcm4chee operations
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// ============================================================================
// PATIENTS API
// ============================================================================

/**
 * Search for patients based on form criteria
 * @param {Object} formData - The search form data
 * @returns {Promise<Array>} - Array of patient records
 */
export const searchPatients = async (formData) => {
  try {
    // Build query parameters from form data
    const queryParams = new URLSearchParams();

    // Patient information
    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching 
        ? `*${formData.patientFamilyName}*` 
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }

    if (formData.patientId) {
      queryParams.append('PatientID', formData.patientId);
    }

    if (formData.issuerOfPatient) {
      queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    }

    if (formData.patientSex) {
      queryParams.append('PatientSex', formData.patientSex);
    }

    if (formData.birthDate) {
      const dicomDate = formData.birthDate.replace(/-/g, '');
      queryParams.append('PatientBirthDate', dicomDate);
    }

    if (formData.verificationStatus) {
      queryParams.append('PatientVerificationStatus', formData.verificationStatus);
    }

    // Filters
    if (formData.limitOfPatients) {
      queryParams.append('limit', formData.limitOfPatients);
    }

    if (formData.orderBy) {
      queryParams.append('orderby', formData.orderBy);
    }

    if (formData.onlyWithStudies) {
      queryParams.append('onlyWithStudies', 'true');
    }

    if (formData.mergedPatients) {
      queryParams.append('merged', 'true');
    }

    // Make API request
    const url = `${API_BASE}/patients?${queryParams.toString()}`;
    console.log('🔍 Searching patients:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return transformPatientData(data);
  } catch (error) {
    console.error('❌ Error searching patients:', error);
    throw error;
  }
};

/**
 * Get studies for a specific patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Array>} - Array of study records
 */
export const getPatientStudies = async (patientId) => {
  try {
    const url = `${API_BASE}/patients/${patientId}/studies`;
    console.log('🔍 Getting patient studies:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch studies: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return transformStudyData(data);
  } catch (error) {
    console.error('❌ Error fetching patient studies:', error);
    throw error;
  }
};

// ============================================================================
// STUDIES API
// ============================================================================

/**
 * Search for studies based on form criteria
 * @param {Object} formData - The search form data
 * @returns {Promise<Array>} - Array of study records
 */
export const searchStudies = async (formData) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Patient information
    if (formData.patientFamilyName) {
      const name = formData.fuzzyMatching 
        ? `*${formData.patientFamilyName}*` 
        : formData.patientFamilyName;
      queryParams.append('PatientName', name);
    }

    if (formData.patientId) {
      queryParams.append('PatientID', formData.patientId);
    }

    if (formData.issuerOfPatient) {
      queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
    }

    // Study information
    if (formData.accessionNumber) {
      queryParams.append('AccessionNumber', formData.accessionNumber);
    }

    if (formData.issuerOfAccessionNumber) {
      queryParams.append('IssuerOfAccessionNumberSequence', formData.issuerOfAccessionNumber);
    }

    if (formData.studyDescription) {
      queryParams.append('StudyDescription', formData.studyDescription);
    }

    if (formData.modality) {
      queryParams.append('ModalitiesInStudy', formData.modality);
    }

    if (formData.referringPhysician) {
      queryParams.append('ReferringPhysicianName', formData.referringPhysician);
    }

    if (formData.institutionalDepartmentName) {
      queryParams.append('InstitutionalDepartmentName', formData.institutionalDepartmentName);
    }

    if (formData.sendingAET) {
      queryParams.append('SendingApplicationEntityTitleOfSeries', formData.sendingAET);
    }

    // Dates (convert to DICOM format YYYYMMDD)
    if (formData.studyDate) {
      const dicomDate = formData.studyDate.replace(/-/g, '');
      queryParams.append('StudyDate', dicomDate);
    }

    if (formData.studyTime) {
      const dicomTime = formData.studyTime.replace(/:/g, '');
      queryParams.append('StudyTime', dicomTime);
    }

    if (formData.studyReceived) {
      const dicomDate = formData.studyReceived.replace(/-/g, '');
      queryParams.append('StudyReceiveDateTime', dicomDate);
    }

    if (formData.studyAccess) {
      const dicomDate = formData.studyAccess.replace(/-/g, '');
      queryParams.append('StudyAccessDateTime', dicomDate);
    }

    // Filters
    if (formData.limit) {
      queryParams.append('limit', formData.limit);
    }

    if (formData.orderBy) {
      queryParams.append('orderby', formData.orderBy);
    }

    // Make API request
    const url = `${API_BASE}/studies?${queryParams.toString()}`;
    console.log('🔍 Searching studies:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return transformStudyData(data);
  } catch (error) {
    console.error('❌ Error searching studies:', error);
    throw error;
  }
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform DICOM patient data to UI-friendly format
 * @param {Array} dicomData - Raw DICOM patient data
 * @returns {Array} - Transformed patient data
 */
const transformPatientData = (dicomData) => {
  if (!Array.isArray(dicomData)) {
    console.warn('Expected array but got:', typeof dicomData);
    return [];
  }

  return dicomData.map((patient, index) => {
    const getValue = (tag, vr = 'Value', idx = 0) => {
      return patient[tag]?.[vr]?.[idx] || '';
    };

    // Extract patient name (format: LastName^FirstName)
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1 
      ? `${nameParts[1]} ${nameParts[0]}` 
      : patientName;

    // Extract and format birth date
    const birthDate = getValue('00100030');
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

/**
 * Transform DICOM study data to UI-friendly format
 * @param {Array} dicomData - Raw DICOM study data
 * @returns {Array} - Transformed study data
 */
const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) {
    console.warn('Expected array but got:', typeof dicomData);
    return [];
  }

  return dicomData.map((study, index) => {
    const getValue = (tag, vr = 'Value', idx = 0) => {
      return study[tag]?.[vr]?.[idx] || '';
    };

    // Extract patient name
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1 
      ? `${nameParts[1]} ${nameParts[0]}` 
      : patientName;

    // Extract and format study date
    const studyDate = getValue('00080020');
    const formattedDate = studyDate && studyDate.length === 8
      ? `${studyDate.slice(0, 4)}-${studyDate.slice(4, 6)}-${studyDate.slice(6, 8)}`
      : studyDate;

    // Extract and format study time
    const studyTime = getValue('00080030');
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
      numberOfSeries: study.numberOfStudyRelatedSeries || getValue('00201206'),
      numberOfInstances: study.numberOfStudyRelatedInstances || getValue('00201208'),
      institutionalDepartmentName: getValue('00081040'),
      rawData: study,
    };
  });
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if API backend is healthy
 * @returns {Promise<Object>} - Health status
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};
// ============================================================================
// MWL API
// ============================================================================

/**
 * Search MWL (Modality Worklist)
 * @param {Object} formData
 * @returns {Promise<Array>}
 */
export const searchMWL = async (formData) => {
  try {
    const queryParams = new URLSearchParams();

    // Patient filters
    if (formData.patientFamilyName) {
      queryParams.append("PatientName", formData.patientFamilyName);
    }

    if (formData.patientId) {
      queryParams.append("PatientID", formData.patientId);
    }

    if (formData.accessionNumber) {
      queryParams.append("AccessionNumber", formData.accessionNumber);
    }

    if (formData.issuerOfPatient) {
      queryParams.append("IssuerOfPatientID", formData.issuerOfPatient);
    }

    // ============================
    // ✅ MODALITY FILTER (MWL)
    // ============================
    if (formData.modality) {
      queryParams.append(
        "ScheduledProcedureStepSequence.Modality",
        formData.modality
      );
    }

    // AE Title
    if (formData.scheduledStationAET) {
      queryParams.append(
        "ScheduledProcedureStepSequence.ScheduledStationAETitle",
        formData.scheduledStationAET
      );
    }

    // SPS Start Time
    if (formData.spsStartTime) {
      const dicomTime = formData.spsStartTime.replace(/:/g, "");
      queryParams.append(
        "ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime",
        dicomTime
      );
    }

    const url = `${API_BASE}/mwl?${queryParams.toString()}`;
    console.log("🔍 MWL Search:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MWL search failed: ${err}`);
    }

    return await response.json();

  } catch (error) {
    console.error("❌ MWL search error:", error);
    throw error;
  }
};

export const transformMWLData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];

  return dicomData.map((item, index) => {
    const getValue = (obj, tag, vr = "Value", idx = 0) =>
      obj?.[tag]?.[vr]?.[idx] || "";

    const sps =
      item["00400100"]?.Value?.[0] || {}; // SPS Sequence

    const patientName =
      getValue(item, "00100010")?.Alphabetic || "";

    return {
      id: index,
      patientName,
      patientId: getValue(item, "00100020"),
      accessionNumber: getValue(item, "00080050"),
      modality: getValue(sps, "00080060"),
      spsStartDate: getValue(sps, "00400002"),
      spsStartTime: getValue(sps, "00400003"),
      stationAET: getValue(sps, "00400001"),
      description: getValue(sps, "00400007"),
      rawData: item,
    };
  });
};
