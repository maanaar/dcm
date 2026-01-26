const API_BASE = import.meta.env.VITE_API_BASE;
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const USERNAME = import.meta.env.VITE_DCM4CHEE_USERNAME;
const PASSWORD = import.meta.env.VITE_DCM4CHEE_PASSWORD;

/**
 * Get authentication token (using dummy token)
 * @returns {Promise<string>} - Dummy access token
 */
export const getToken = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('Getting dummy authentication token');
  
  // Return a dummy JWT-like token
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkR1bW15IFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
};

/**
 * Fetch all studies (using dummy data)
 * @returns {Promise<Array>} - Array of study records
 */
export const fetchStudies = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('Fetching all studies (dummy data)');

  const studyTemplates = [
    { description: 'CT Chest with Contrast', modality: 'CT', series: 4, instances: 250 },
    { description: 'MRI Brain with and without Contrast', modality: 'MR', series: 8, instances: 420 },
    { description: 'X-Ray Chest PA and Lateral', modality: 'CR', series: 2, instances: 2 },
    { description: 'Ultrasound Abdomen Complete', modality: 'US', series: 3, instances: 45 },
    { description: 'PET/CT Whole Body', modality: 'PT', series: 5, instances: 380 },
    { description: 'CT Abdomen and Pelvis with Contrast', modality: 'CT', series: 6, instances: 450 },
    { description: 'MRI Spine Lumbar', modality: 'MR', series: 6, instances: 320 },
    { description: 'Mammography Bilateral', modality: 'MG', series: 4, instances: 8 },
  ];

  const studies = [];
  const today = new Date();
  
  // Generate 20 random studies from different patients
  for (let i = 0; i < 20; i++) {
    const patientIndex = i % DUMMY_PATIENTS.length;
    const patient = DUMMY_PATIENTS[patientIndex];
    const template = studyTemplates[i % studyTemplates.length];
    
    // Generate a date within the last year
    const daysAgo = Math.floor(Math.random() * 365);
    const studyDate = new Date(today);
    studyDate.setDate(studyDate.getDate() - daysAgo);
    const formattedDate = studyDate.toISOString().split('T')[0].replace(/-/g, '');
    
    const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const studyTime = `${hour}${minute}${second}`;

    const seriesVariation = Math.floor(Math.random() * 3) - 1;
    const instanceVariation = Math.floor(Math.random() * 50) - 25;

    studies.push({
      '0020000D': { Value: [`1.2.840.113619.${patient['00100020'].Value[0]}.${i + 1}.${Date.now()}`] },
      '00080020': { Value: [formattedDate] },
      '00080030': { Value: [studyTime] },
      '00081030': { Value: [template.description] },
      '00080060': { Value: [template.modality] },
      '00080050': { Value: [`ACC${String(i + 1).padStart(6, '0')}`] },
      '00200010': { Value: [`${i + 1}`] },
      '00080090': { Value: ['Dr. Radiologist'] },
      '00100010': patient['00100010'], // Patient Name
      '00100020': patient['00100020'], // Patient ID
      '00100030': patient['00100030'], // Patient Birth Date
      '00100040': patient['00100040'], // Patient Sex
      '00201206': { Value: [Math.max(1, template.series + seriesVariation)] },
      '00201208': { Value: [Math.max(1, template.instances + instanceVariation)] },
    });
  }

  // Sort by date (most recent first)
  studies.sort((a, b) => {
    const dateA = a['00080020'].Value[0];
    const dateB = b['00080020'].Value[0];
    return dateB.localeCompare(dateA);
  });

  return studies;
};

// Dummy patient data
const DUMMY_PATIENTS = [
  {
    '00100010': { Value: [{ Alphabetic: 'Smith^John' }] },
    '00100020': { Value: ['PAT001'] },
    '00100030': { Value: ['19850315'] },
    '00100040': { Value: ['M'] },
    '00100021': { Value: ['HOSPITAL_A'] },
    '00101024': { Value: ['VERIFIED'] },
    numberOfStudies: 5
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Johnson^Sarah' }] },
    '00100020': { Value: ['PAT002'] },
    '00100030': { Value: ['19920622'] },
    '00100040': { Value: ['F'] },
    '00100021': { Value: ['HOSPITAL_A'] },
    '00101024': { Value: ['VERIFIED'] },
    numberOfStudies: 3
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Williams^Michael' }] },
    '00100020': { Value: ['PAT003'] },
    '00100030': { Value: ['19780910'] },
    '00100040': { Value: ['M'] },
    '00100021': { Value: ['HOSPITAL_B'] },
    '00101024': { Value: ['NOT_VERIFIED'] },
    numberOfStudies: 8
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Brown^Emily' }] },
    '00100020': { Value: ['PAT004'] },
    '00100030': { Value: ['20000105'] },
    '00100040': { Value: ['F'] },
    '00100021': { Value: ['HOSPITAL_A'] },
    '00101024': { Value: ['VERIFIED'] },
    numberOfStudies: 2
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Davis^Robert' }] },
    '00100020': { Value: ['PAT005'] },
    '00100030': { Value: ['19651228'] },
    '00100040': { Value: ['M'] },
    '00100021': { Value: ['HOSPITAL_C'] },
    '00101024': { Value: ['VERIFIED'] },
    numberOfStudies: 12
  }
];

/**
 * Search for patients based on form criteria (using dummy data)
 * @param {Object} formData - The search form data
 * @returns {Promise<Array>} - Array of patient records
 */
export const searchPatients = async (formData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('Searching patients with form data:', formData);

  // Filter dummy data based on form criteria
  let filteredPatients = [...DUMMY_PATIENTS];

  if (formData.patientFamilyName) {
    const searchTerm = formData.patientFamilyName.toLowerCase();
    filteredPatients = filteredPatients.filter(patient => {
      const name = patient['00100010']?.Value?.[0]?.Alphabetic || '';
      if (formData.fuzzyMatching) {
        return name.toLowerCase().includes(searchTerm);
      }
      return name.toLowerCase().startsWith(searchTerm);
    });
  }

  if (formData.patientId) {
    filteredPatients = filteredPatients.filter(patient => 
      patient['00100020']?.Value?.[0] === formData.patientId
    );
  }

  if (formData.issuerOfPatient) {
    filteredPatients = filteredPatients.filter(patient => 
      patient['00100021']?.Value?.[0] === formData.issuerOfPatient
    );
  }

  if (formData.patientSex) {
    filteredPatients = filteredPatients.filter(patient => 
      patient['00100040']?.Value?.[0] === formData.patientSex
    );
  }

  if (formData.birthDate) {
    const searchDate = formData.birthDate.replace(/-/g, '');
    filteredPatients = filteredPatients.filter(patient => 
      patient['00100030']?.Value?.[0] === searchDate
    );
  }

  if (formData.verificationStatus) {
    filteredPatients = filteredPatients.filter(patient => 
      patient['00101024']?.Value?.[0] === formData.verificationStatus
    );
  }

  if (formData.onlyWithStudies) {
    filteredPatients = filteredPatients.filter(patient => 
      patient.numberOfStudies > 0
    );
  }

  // Apply limit
  if (formData.limitOfPatients) {
    filteredPatients = filteredPatients.slice(0, parseInt(formData.limitOfPatients));
  }

  // Transform the response to match your UI format
  return transformPatientData(filteredPatients);
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
 * Fetch studies for a specific patient (using dummy data)
 * @param {string} patientId - The patient ID
 * @returns {Promise<Array>} - Array of study records
 */
export const fetchPatientStudies = async (patientId) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('Fetching studies for patient:', patientId);

  // Expanded study templates with more realistic variety
  const studyTemplates = [
    { description: 'CT Chest with Contrast', modality: 'CT', series: 4, instances: 250 },
    { description: 'CT Chest without Contrast', modality: 'CT', series: 3, instances: 180 },
    { description: 'MRI Brain with and without Contrast', modality: 'MR', series: 8, instances: 420 },
    { description: 'MRI Spine Lumbar', modality: 'MR', series: 6, instances: 320 },
    { description: 'MRI Knee Left', modality: 'MR', series: 5, instances: 280 },
    { description: 'X-Ray Chest PA and Lateral', modality: 'CR', series: 2, instances: 2 },
    { description: 'X-Ray Hand Right', modality: 'CR', series: 1, instances: 3 },
    { description: 'Ultrasound Abdomen Complete', modality: 'US', series: 3, instances: 45 },
    { description: 'Ultrasound Pelvis', modality: 'US', series: 2, instances: 30 },
    { description: 'PET/CT Whole Body', modality: 'PT', series: 5, instances: 380 },
    { description: 'CT Abdomen and Pelvis with Contrast', modality: 'CT', series: 6, instances: 450 },
    { description: 'MRI Brain without Contrast', modality: 'MR', series: 5, instances: 200 },
    { description: 'CT Head without Contrast', modality: 'CT', series: 2, instances: 120 },
    { description: 'Mammography Bilateral', modality: 'MG', series: 4, instances: 8 },
    { description: 'Fluoroscopy Upper GI', modality: 'XA', series: 1, instances: 150 },
    { description: 'Nuclear Medicine Bone Scan', modality: 'NM', series: 3, instances: 90 },
    { description: 'CT Angiography Head and Neck', modality: 'CT', series: 7, instances: 520 },
    { description: 'MRI Cardiac Function', modality: 'MR', series: 10, instances: 650 },
    { description: 'X-Ray Abdomen Supine', modality: 'CR', series: 1, instances: 1 },
    { description: 'Ultrasound Thyroid', modality: 'US', series: 1, instances: 25 }
  ];

  // Generate dummy studies based on patient
  const patient = DUMMY_PATIENTS.find(p => p['00100020']?.Value?.[0] === patientId);
  const numStudies = patient?.numberOfStudies || 0;

  const studies = [];
  const today = new Date();
  
  for (let i = 0; i < numStudies; i++) {
    // Pick a random study template
    const template = studyTemplates[Math.floor(Math.random() * studyTemplates.length)];
    
    // Generate a date within the last 2 years
    const daysAgo = Math.floor(Math.random() * 730);
    const studyDate = new Date(today);
    studyDate.setDate(studyDate.getDate() - daysAgo);
    const formattedDate = studyDate.toISOString().split('T')[0].replace(/-/g, '');
    
    // Generate study time
    const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const studyTime = `${hour}${minute}${second}`;

    // Add some variation to instances and series
    const seriesVariation = Math.floor(Math.random() * 3) - 1;
    const instanceVariation = Math.floor(Math.random() * 50) - 25;

    studies.push({
      '0020000D': { Value: [`1.2.840.113619.${patientId}.${i + 1}.${Date.now()}`] }, // Study Instance UID
      '00080020': { Value: [formattedDate] }, // Study Date
      '00080030': { Value: [studyTime] }, // Study Time
      '00081030': { Value: [template.description] }, // Study Description
      '00080060': { Value: [template.modality] }, // Modality
      '00080050': { Value: [`ACC${String(i + 1).padStart(6, '0')}`] }, // Accession Number
      '00200010': { Value: [`${i + 1}`] }, // Study ID
      '00080090': { Value: ['Dr. Radiologist'] }, // Referring Physician
      '00201206': { Value: [Math.max(1, template.series + seriesVariation)] }, // Number of Series
      '00201208': { Value: [Math.max(1, template.instances + instanceVariation)] }, // Number of Instances
      studyInstanceUID: `1.2.840.113619.${patientId}.${i + 1}.${Date.now()}`,
      studyDate: formattedDate,
      studyTime: studyTime,
      studyDescription: template.description,
      modality: template.modality,
      accessionNumber: `ACC${String(i + 1).padStart(6, '0')}`,
      numberOfSeries: Math.max(1, template.series + seriesVariation),
      numberOfInstances: Math.max(1, template.instances + instanceVariation)
    });
  }

  // Sort by date (most recent first)
  studies.sort((a, b) => {
    const dateA = a['00080020'].Value[0];
    const dateB = b['00080020'].Value[0];
    return dateB.localeCompare(dateA);
  });

  return studies;
};
// // Dummy patient data for reference
// const DUMMY_PATIENTS = [
//   {
//     '00100010': { Value: [{ Alphabetic: 'Smith^John' }] },
//     '00100020': { Value: ['PAT001'] },
//     '00100030': { Value: ['19850315'] },
//     '00100040': { Value: ['M'] },
//   },
//   {
//     '00100010': { Value: [{ Alphabetic: 'Johnson^Sarah' }] },
//     '00100020': { Value: ['PAT002'] },
//     '00100030': { Value: ['19920622'] },
//     '00100040': { Value: ['F'] },
//   },
//   {
//     '00100010': { Value: [{ Alphabetic: 'Williams^Michael' }] },
//     '00100020': { Value: ['PAT003'] },
//     '00100030': { Value: ['19780910'] },
//     '00100040': { Value: ['M'] },
//   },
//   {
//     '00100010': { Value: [{ Alphabetic: 'Brown^Emily' }] },
//     '00100020': { Value: ['PAT004'] },
//     '00100030': { Value: ['20000105'] },
//     '00100040': { Value: ['F'] },
//   },
//   {
//     '00100010': { Value: [{ Alphabetic: 'Davis^Robert' }] },
//     '00100020': { Value: ['PAT005'] },
//     '00100030': { Value: ['19651228'] },
//     '00100040': { Value: ['M'] },
//   }
// ];

// Generate dummy studies dataset
const generateDummyStudies = () => {
  const studyTemplates = [
    { description: 'CT Chest with Contrast', modality: 'CT', series: 4, instances: 250 },
    { description: 'CT Chest without Contrast', modality: 'CT', series: 3, instances: 180 },
    { description: 'MRI Brain with and without Contrast', modality: 'MR', series: 8, instances: 420 },
    { description: 'MRI Spine Lumbar', modality: 'MR', series: 6, instances: 320 },
    { description: 'MRI Knee Left', modality: 'MR', series: 5, instances: 280 },
    { description: 'X-Ray Chest PA and Lateral', modality: 'CR', series: 2, instances: 2 },
    { description: 'X-Ray Hand Right', modality: 'CR', series: 1, instances: 3 },
    { description: 'Ultrasound Abdomen Complete', modality: 'US', series: 3, instances: 45 },
    { description: 'Ultrasound Pelvis', modality: 'US', series: 2, instances: 30 },
    { description: 'PET/CT Whole Body', modality: 'PT', series: 5, instances: 380 },
    { description: 'CT Abdomen and Pelvis with Contrast', modality: 'CT', series: 6, instances: 450 },
    { description: 'MRI Brain without Contrast', modality: 'MR', series: 5, instances: 200 },
    { description: 'CT Head without Contrast', modality: 'CT', series: 2, instances: 120 },
    { description: 'Mammography Bilateral', modality: 'MG', series: 4, instances: 8 },
    { description: 'Nuclear Medicine Bone Scan', modality: 'NM', series: 3, instances: 90 },
    { description: 'CT Angiography Head and Neck', modality: 'CT', series: 7, instances: 520 },
  ];

  const physicians = [
    'Dr. Anderson',
    'Dr. Martinez',
    'Dr. Thompson',
    'Dr. Wilson',
    'Dr. Lee',
    'Dr. Brown'
  ];

  const departments = [
    'Radiology',
    'Emergency',
    'Cardiology',
    'Neurology',
    'Orthopedics'
  ];

  const aets = ['PACS_1', 'PACS_2', 'CT_SCANNER', 'MR_SCANNER', 'US_ROOM'];

  const studies = [];
  const today = new Date();

  // Generate 50 studies
  for (let i = 0; i < 50; i++) {
    const patientIndex = i % DUMMY_PATIENTS.length;
    const patient = DUMMY_PATIENTS[patientIndex];
    const template = studyTemplates[i % studyTemplates.length];

    // Generate study date within last 2 years
    const daysAgo = Math.floor(Math.random() * 730);
    const studyDate = new Date(today);
    studyDate.setDate(studyDate.getDate() - daysAgo);
    const formattedDate = studyDate.toISOString().split('T')[0].replace(/-/g, '');

    // Generate study time
    const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const studyTime = `${hour}${minute}${second}`;

    // Generate received and access dates (within a few days after study)
    const receivedDate = new Date(studyDate);
    receivedDate.setDate(receivedDate.getDate() + Math.floor(Math.random() * 3));
    const formattedReceivedDate = receivedDate.toISOString().split('T')[0].replace(/-/g, '');

    const accessDate = new Date(receivedDate);
    accessDate.setDate(accessDate.getDate() + Math.floor(Math.random() * 2));
    const formattedAccessDate = accessDate.toISOString().split('T')[0].replace(/-/g, '');

    studies.push({
      '0020000D': { Value: [`1.2.840.113619.${patient['00100020'].Value[0]}.${i + 1}`] }, // Study Instance UID
      '00080020': { Value: [formattedDate] }, // Study Date
      '00080030': { Value: [studyTime] }, // Study Time
      '00081030': { Value: [template.description] }, // Study Description
      '00080060': { Value: [template.modality] }, // Modality
      '00080050': { Value: [`ACC${String(i + 1).padStart(6, '0')}`] }, // Accession Number
      '00080051': { Value: [`ISSUER_${Math.floor(Math.random() * 3) + 1}`] }, // Issuer of Accession Number
      '00200010': { Value: [`${i + 1}`] }, // Study ID
      '00080090': { Value: [physicians[i % physicians.length]] }, // Referring Physician
      '00081040': { Value: [departments[i % departments.length]] }, // Institutional Department
      '00100010': patient['00100010'], // Patient Name
      '00100020': patient['00100020'], // Patient ID
      '00100021': { Value: [`HOSPITAL_${String.fromCharCode(65 + (i % 3))}`] }, // Issuer of Patient ID
      '00100030': patient['00100030'], // Patient Birth Date
      '00100040': patient['00100040'], // Patient Sex
      '00201206': { Value: [template.series] }, // Number of Series
      '00201208': { Value: [template.instances] }, // Number of Instances
      // Custom fields
      sendingAET: aets[i % aets.length],
      studyReceived: formattedReceivedDate,
      studyAccess: formattedAccessDate,
    });
  }

  return studies;
};

const DUMMY_STUDIES = generateDummyStudies();

/**
 * Search for studies based on form criteria
 * @param {Object} formData - The search form data
 * @returns {Promise<Array>} - Array of study records
 */
export const searchStudies = async (formData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  console.log('Searching studies with form data:', formData);

  let filteredStudies = [...DUMMY_STUDIES];

  // Filter by patient family name
  if (formData.patientFamilyName) {
    const searchTerm = formData.patientFamilyName.toLowerCase();
    filteredStudies = filteredStudies.filter(study => {
      const name = study['00100010']?.Value?.[0]?.Alphabetic || '';
      if (formData.fuzzyMatching) {
        return name.toLowerCase().includes(searchTerm);
      }
      return name.toLowerCase().startsWith(searchTerm);
    });
  }

  // Filter by patient ID
  if (formData.patientId) {
    filteredStudies = filteredStudies.filter(study =>
      study['00100020']?.Value?.[0] === formData.patientId
    );
  }

  // Filter by accession number
  if (formData.accessionNumber) {
    filteredStudies = filteredStudies.filter(study =>
      study['00080050']?.Value?.[0]?.includes(formData.accessionNumber)
    );
  }

  // Filter by issuer of patient
  if (formData.issuerOfPatient) {
    filteredStudies = filteredStudies.filter(study =>
      study['00100021']?.Value?.[0] === formData.issuerOfPatient
    );
  }

  // Filter by issuer of accession number
  if (formData.issuerOfAccessionNumber) {
    filteredStudies = filteredStudies.filter(study =>
      study['00080051']?.Value?.[0] === formData.issuerOfAccessionNumber
    );
  }

  // Filter by study description
  if (formData.studyDescription) {
    const searchTerm = formData.studyDescription.toLowerCase();
    filteredStudies = filteredStudies.filter(study =>
      study['00081030']?.Value?.[0]?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by modality
  if (formData.modality && formData.modality !== 'all') {
    filteredStudies = filteredStudies.filter(study =>
      study['00080060']?.Value?.[0] === formData.modality
    );
  }

  // Filter by referring physician
  if (formData.referringPhysician) {
    const searchTerm = formData.referringPhysician.toLowerCase();
    filteredStudies = filteredStudies.filter(study =>
      study['00080090']?.Value?.[0]?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by institutional department
  if (formData.institutionalDepartment) {
    const searchTerm = formData.institutionalDepartment.toLowerCase();
    filteredStudies = filteredStudies.filter(study =>
      study['00081040']?.Value?.[0]?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by sending AET
  if (formData.sendingAET) {
    filteredStudies = filteredStudies.filter(study =>
      study.sendingAET?.includes(formData.sendingAET)
    );
  }

  // Filter by study date
  if (formData.studyDate) {
    const searchDate = formData.studyDate.replace(/-/g, '');
    filteredStudies = filteredStudies.filter(study =>
      study['00080020']?.Value?.[0] === searchDate
    );
  }

  // Filter by study time (if provided as a range or specific time)
  if (formData.studyTime) {
    const searchTime = formData.studyTime.replace(/:/g, '');
    filteredStudies = filteredStudies.filter(study =>
      study['00080030']?.Value?.[0]?.startsWith(searchTime)
    );
  }

  // Filter by study received date
  if (formData.studyReceived) {
    const searchDate = formData.studyReceived.replace(/-/g, '');
    filteredStudies = filteredStudies.filter(study =>
      study.studyReceived === searchDate
    );
  }

  // Filter by study access date
  if (formData.studyAccess) {
    const searchDate = formData.studyAccess.replace(/-/g, '');
    filteredStudies = filteredStudies.filter(study =>
      study.studyAccess === searchDate
    );
  }

  // Apply ordering
  if (formData.orderBy) {
    filteredStudies.sort((a, b) => {
      switch (formData.orderBy) {
        case 'StudyDate':
          return b['00080020'].Value[0].localeCompare(a['00080020'].Value[0]);
        case 'PatientName':
          return (a['00100010']?.Value?.[0]?.Alphabetic || '').localeCompare(
            b['00100010']?.Value?.[0]?.Alphabetic || ''
          );
        case 'Modality':
          return (a['00080060']?.Value?.[0] || '').localeCompare(
            b['00080060']?.Value?.[0] || ''
          );
        default:
          return 0;
      }
    });
  }

  // Apply limit
  if (formData.limit) {
    filteredStudies = filteredStudies.slice(0, parseInt(formData.limit));
  }

  return transformStudyData(filteredStudies);
};

/**
 * Transform DICOM study data to UI-friendly format
 * @param {Array} dicomData - Raw DICOM study data
 * @returns {Array} - Transformed study data
 */
const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) {
    return [];
  }

  return dicomData.map((study, index) => {
    const getValue = (tag, vr = 'Value', index = 0) => {
      return study[tag]?.[vr]?.[index] || '';
    };

    // Extract patient name
    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1
      ? `${nameParts[1]} ${nameParts[0]}`
      : patientName;

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr.length !== 8) return '';
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    };

    // Format time
    const formatTime = (timeStr) => {
      if (!timeStr || timeStr.length < 6) return '';
      return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
    };

    return {
      id: getValue('0020000D'),
      studyInstanceUID: getValue('0020000D'),
      studyID: getValue('00200010'),
      accessionNumber: getValue('00080050'),
      studyDate: formatDate(getValue('00080020')),
      studyTime: formatTime(getValue('00080030')),
      studyDescription: getValue('00081030'),
      modality: getValue('00080060'),
      patientName: displayName,
      patientId: getValue('00100020'),
      numberOfSeries: getValue('00201206'),
      numberOfInstances: getValue('00201208'),
      referringPhysician: getValue('00080090'),
      institutionalDepartment: getValue('00081040'),
      sendingAET: study.sendingAET,
      studyReceived: formatDate(study.studyReceived),
      studyAccess: formatDate(study.studyAccess),
      rawData: study,
    };
  });
};