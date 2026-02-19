const API_BASE = import.meta.env.VITE_API_BASE;

// ── Patients ──────────────────────────────────────────────────────────────────

export const searchPatients = async (formData) => {
  const queryParams = new URLSearchParams();

  if (formData.patientFamilyName) {
    const name = formData.fuzzyMatching
      ? `*${formData.patientFamilyName}*`
      : formData.patientFamilyName;
    queryParams.append('PatientName', name);
  }
  if (formData.patientId)          queryParams.append('PatientID', formData.patientId);
  if (formData.issuerOfPatient)    queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
  if (formData.patientSex)         queryParams.append('PatientSex', formData.patientSex);
  if (formData.birthDate)          queryParams.append('PatientBirthDate', formData.birthDate.replace(/-/g, ''));
  if (formData.verificationStatus) queryParams.append('PatientVerificationStatus', formData.verificationStatus);
  if (formData.limitOfPatients)    queryParams.append('limit', formData.limitOfPatients);
  if (formData.orderBy)            queryParams.append('orderby', formData.orderBy);
  if (formData.onlyWithStudies)    queryParams.append('onlyWithStudies', 'true');
  if (formData.mergedPatients)     queryParams.append('merged', 'true');

  queryParams.append('webAppService', formData.webAppService || 'dcm4chee-arc');

  const response = await fetch(`${API_BASE}/api/patients?${queryParams}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

  const data = await response.json();
  return transformPatientData(data);
};

export const fetchPatientStudies = async (patientId, webAppService = 'dcm4chee-arc') => {
  const response = await fetch(
    `${API_BASE}/api/patients/${encodeURIComponent(patientId)}/studies?webAppService=${webAppService}`
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return response.json();
};

const transformPatientData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];

  return dicomData.map((patient, index) => {
    const getValue = (tag) => patient[tag]?.Value?.[0] ?? '';

    const patientName = getValue('00100010')?.Alphabetic ?? '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1
      ? `${nameParts[1]} ${nameParts[0]}`.trim()
      : patientName;

    const birthDate = getValue('00100030');
    const formattedBirthDate = birthDate
      ? `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`
      : '';

    return {
      id: patient['00100020']?.Value?.[0] ?? `patient_${index}`,
      name: displayName,
      patientId: getValue('00100020'),
      sex: getValue('00100040'),
      birthDate: formattedBirthDate,
      studies: patient.numberOfStudies ?? 0,
      issuer: getValue('00100021'),
      verificationStatus: getValue('00101024'),
    };
  });
};

// ── Studies ───────────────────────────────────────────────────────────────────

export const searchStudies = async (formData) => {
  const queryParams = new URLSearchParams();

  if (formData.patientFamilyName) {
    const name = formData.fuzzyMatching
      ? `*${formData.patientFamilyName}*`
      : formData.patientFamilyName;
    queryParams.append('PatientName', name);
  }
  if (formData.patientId)              queryParams.append('PatientID', formData.patientId);
  if (formData.accessionNumber)        queryParams.append('AccessionNumber', formData.accessionNumber);
  if (formData.issuerOfPatient)        queryParams.append('IssuerOfPatientID', formData.issuerOfPatient);
  if (formData.studyDescription)       queryParams.append('StudyDescription', `*${formData.studyDescription}*`);
  if (formData.modality && formData.modality !== 'all') queryParams.append('ModalitiesInStudy', formData.modality);
  if (formData.referringPhysician)     queryParams.append('ReferringPhysicianName', `*${formData.referringPhysician}*`);
  if (formData.studyDate)              queryParams.append('StudyDate', formData.studyDate.replace(/-/g, ''));
  if (formData.orderBy)                queryParams.append('orderby', formData.orderBy);
  if (formData.limit)                  queryParams.append('limit', formData.limit);

  queryParams.append('webAppService', formData.webAppService || 'dcm4chee-arc');

  const response = await fetch(`${API_BASE}/api/studies?${queryParams}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

  const data = await response.json();
  return transformStudyData(data);
};

const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];

  return dicomData.map((study) => {
    const getValue = (tag) => study[tag]?.Value?.[0] ?? '';

    const patientName = getValue('00100010')?.Alphabetic ?? '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1
      ? `${nameParts[1]} ${nameParts[0]}`.trim()
      : patientName;

    const fmtDate = (d) =>
      d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '';
    const fmtTime = (t) =>
      t && t.length >= 6 ? `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}` : '';

    return {
      id: getValue('0020000D'),
      studyInstanceUID: getValue('0020000D'),
      studyID: getValue('00200010'),
      accessionNumber: getValue('00080050'),
      studyDate: fmtDate(getValue('00080020')),
      studyTime: fmtTime(getValue('00080030')),
      studyDescription: getValue('00081030'),
      modality: getValue('00080060'),
      patientName: displayName,
      patientId: getValue('00100020'),
      numberOfSeries: getValue('00201206'),
      numberOfInstances: getValue('00201208'),
      referringPhysician: getValue('00080090'),
      institutionalDepartment: getValue('00081040'),
    };
  });
};
