const API_BASE = import.meta.env.VITE_API_BASE;
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const USERNAME = import.meta.env.VITE_DCM4CHEE_USERNAME;
const PASSWORD = import.meta.env.VITE_DCM4CHEE_PASSWORD;

export const getToken = async () => {
  try {
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/dcm4che/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'dcm4chee-arc-ui',
          username: USERNAME,
          password: PASSWORD,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to authenticate');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const fetchStudies = async () => {
  try {
    const token = await getToken();

    const response = await fetch(
      `${API_BASE}/dcm4chee-arc/aets/DCM4CHEE/rs/studies`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching studies:', error);
    throw error;
  }
};

/**
 * Search for patients based on form criteria
 * @param {Object} formData - The search form data
 * @returns {Promise<Array>} - Array of patient records
 */
export const searchPatients = async (formData) => {
  try {
    const token = await getToken();

    // Build query parameters from form data
    const queryParams = new URLSearchParams();

    // Map form fields to DICOM query parameters
    if (formData.patientFamilyName) {
      // Use fuzzy matching if enabled
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
      // Convert date format from YYYY-MM-DD to YYYYMMDD (DICOM format)
      const dicomDate = formData.birthDate.replace(/-/g, '');
      queryParams.append('PatientBirthDate', dicomDate);
    }

    if (formData.verificationStatus) {
      queryParams.append('PatientVerificationStatus', formData.verificationStatus);
    }

    // Add limit
    if (formData.limitOfPatients) {
      queryParams.append('limit', formData.limitOfPatients);
    }

    // Add ordering
    if (formData.orderBy) {
      queryParams.append('orderby', formData.orderBy);
    }

    // Add filter for patients with studies
    if (formData.onlyWithStudies) {
      queryParams.append('onlyWithStudies', 'true');
    }

    // Add merged patients filter
    if (formData.mergedPatients) {
      queryParams.append('merged', 'true');
    }

    // Build the endpoint URL based on web app service
    const endpoint = `${API_BASE}/${formData.webAppService}/aets/DCM4CHEE/rs/patients`;
    const url = `${endpoint}?${queryParams.toString()}`;

    console.log('Searching patients with URL:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to match your UI format
    return transformPatientData(data);
  } catch (error) {
    console.error('Error searching patients:', error);
    throw error;
  }
};

/**
 * Transform DICOM patient data to UI-friendly format
 * @param {Array} dicomData - Raw DICOM patient data
 * @returns {Array} - Transformed patient data
 */
const transformPatientData = (dicomData) => {
  if (!Array.isArray(dicomData)) {
    return [];
  }

  return dicomData.map((patient, index) => {
    // DICOM data uses tag-based structure
    const getValue = (tag, vr = 'Value', index = 0) => {
      return patient[tag]?.[vr]?.[index] || '';
    };

    // Extract patient name (usually in format: LastName^FirstName)
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1 
      ? `${nameParts[1]} ${nameParts[0]}` 
      : patientName;

    // Extract birth date and format it
    const birthDate = getValue('00100030');
    const formattedBirthDate = birthDate 
      ? `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`
      : '';

    return {
      id: patient['00100020']?.Value?.[0] || `patient_${index}`,
      name: displayName,
      patientId: getValue('00100020'), // Patient ID
      sex: getValue('00100040'), // Patient Sex
      birthDate: formattedBirthDate,
      studies: patient.numberOfStudies || 0,
      issuer: getValue('00100021'), // Issuer of Patient ID
      verificationStatus: getValue('00101024'), // Patient Verification Status
      rawData: patient, // Keep raw data for detailed view
    };
  });
};

/**
 * Fetch studies for a specific patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Array>} - Array of study records
 */
export const fetchPatientStudies = async (patientId) => {
  try {
    const token = await getToken();

    const response = await fetch(
      `${API_BASE}/dcm4chee-arc/aets/DCM4CHEE/rs/patients/${patientId}/studies`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching patient studies:', error);
    throw error;
  }
};