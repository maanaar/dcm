import { useState } from 'react';

// Dummy patient data for reference
const DUMMY_PATIENTS = [
  {
    '00100010': { Value: [{ Alphabetic: 'Smith^John' }] },
    '00100020': { Value: ['PAT001'] },
    '00100030': { Value: ['19850315'] },
    '00100040': { Value: ['M'] },
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Johnson^Sarah' }] },
    '00100020': { Value: ['PAT002'] },
    '00100030': { Value: ['19920622'] },
    '00100040': { Value: ['F'] },
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Williams^Michael' }] },
    '00100020': { Value: ['PAT003'] },
    '00100030': { Value: ['19780910'] },
    '00100040': { Value: ['M'] },
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Brown^Emily' }] },
    '00100020': { Value: ['PAT004'] },
    '00100030': { Value: ['20000105'] },
    '00100040': { Value: ['F'] },
  },
  {
    '00100010': { Value: [{ Alphabetic: 'Davis^Robert' }] },
    '00100020': { Value: ['PAT005'] },
    '00100030': { Value: ['19651228'] },
    '00100040': { Value: ['M'] },
  }
];

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

  const physicians = ['Dr. Anderson', 'Dr. Martinez', 'Dr. Thompson', 'Dr. Wilson', 'Dr. Lee', 'Dr. Brown'];
  const departments = ['Radiology', 'Emergency', 'Cardiology', 'Neurology', 'Orthopedics'];
  const aets = ['PACS_1', 'PACS_2', 'CT_SCANNER', 'MR_SCANNER', 'US_ROOM'];

  const studies = [];
  const today = new Date();

  for (let i = 0; i < 50; i++) {
    const patientIndex = i % DUMMY_PATIENTS.length;
    const patient = DUMMY_PATIENTS[patientIndex];
    const template = studyTemplates[i % studyTemplates.length];

    const daysAgo = Math.floor(Math.random() * 730);
    const studyDate = new Date(today);
    studyDate.setDate(studyDate.getDate() - daysAgo);
    const formattedDate = studyDate.toISOString().split('T')[0].replace(/-/g, '');

    const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const studyTime = `${hour}${minute}${second}`;

    studies.push({
      '0020000D': { Value: [`1.2.840.113619.${patient['00100020'].Value[0]}.${i + 1}`] },
      '00080020': { Value: [formattedDate] },
      '00080030': { Value: [studyTime] },
      '00081030': { Value: [template.description] },
      '00080060': { Value: [template.modality] },
      '00080050': { Value: [`ACC${String(i + 1).padStart(6, '0')}`] },
      '00080051': { Value: [`ISSUER_${Math.floor(Math.random() * 3) + 1}`] },
      '00200010': { Value: [`${i + 1}`] },
      '00080090': { Value: [physicians[i % physicians.length]] },
      '00081040': { Value: [departments[i % departments.length]] },
      '00100010': patient['00100010'],
      '00100020': patient['00100020'],
      '00100021': { Value: [`HOSPITAL_${String.fromCharCode(65 + (i % 3))}`] },
      '00100030': patient['00100030'],
      '00100040': patient['00100040'],
      '00201206': { Value: [template.series] },
      '00201208': { Value: [template.instances] },
      sendingAET: aets[i % aets.length],
    });
  }

  return studies;
};

const DUMMY_STUDIES = generateDummyStudies();

const searchStudies = async (formData) => {
  await new Promise(resolve => setTimeout(resolve, 600));

  let filteredStudies = [...DUMMY_STUDIES];

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

  if (formData.patientId) {
    filteredStudies = filteredStudies.filter(study =>
      study['00100020']?.Value?.[0] === formData.patientId
    );
  }

  if (formData.accessionNumber) {
    filteredStudies = filteredStudies.filter(study =>
      study['00080050']?.Value?.[0]?.includes(formData.accessionNumber)
    );
  }

  if (formData.studyDescription) {
    const searchTerm = formData.studyDescription.toLowerCase();
    filteredStudies = filteredStudies.filter(study =>
      study['00081030']?.Value?.[0]?.toLowerCase().includes(searchTerm)
    );
  }

  if (formData.modality && formData.modality !== 'all') {
    filteredStudies = filteredStudies.filter(study =>
      study['00080060']?.Value?.[0] === formData.modality
    );
  }

  if (formData.referringPhysician) {
    const searchTerm = formData.referringPhysician.toLowerCase();
    filteredStudies = filteredStudies.filter(study =>
      study['00080090']?.Value?.[0]?.toLowerCase().includes(searchTerm)
    );
  }

  if (formData.studyDate) {
    const searchDate = formData.studyDate.replace(/-/g, '');
    filteredStudies = filteredStudies.filter(study =>
      study['00080020']?.Value?.[0] === searchDate
    );
  }

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

  return transformStudyData(filteredStudies);
};

const transformStudyData = (dicomData) => {
  if (!Array.isArray(dicomData)) return [];

  return dicomData.map((study) => {
    const getValue = (tag, vr = 'Value', index = 0) => {
      return study[tag]?.[vr]?.[index] || '';
    };

    const patientName = getValue('00100010', 'Value', 0)?.Alphabetic || '';
    const nameParts = patientName.split('^');
    const displayName = nameParts.length > 1
      ? `${nameParts[1]} ${nameParts[0]}`
      : patientName;

    const formatDate = (dateStr) => {
      if (!dateStr || dateStr.length !== 8) return '';
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    };

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
      rawData: study,
    };
  });
};

export default function StudiesBox() {
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    accessionNumber: '',
    fuzzyMatching: false,
    issuerOfPatient: '',
    issuerOfAccessionNumber: '',
    studyDescription: '',
    modality: 'all',
    referringPhysician: '',
    institutionalDepartment: '',
    sendingAET: '',
    studyDate: '',
    studyTime: '',
    studyReceived: '',
    studyAccess: '',
    orderBy: '',
    webAppService: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setIsSearching(true);

    try {
      const results = await searchStudies(formData);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching studies. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-white/80 backdrop-blur-md border shadow">
        {/* Header */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <span className="text-2xl text-[rgb(215,160,56)]">✴</span>
          <h2 className="text-2xl font-semibold">Studies</h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <Input
              label="Patient family name"
              name="patientFamilyName"
              value={formData.patientFamilyName}
              onChange={handleInputChange}
            />
            <Input
              label="Patient ID"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
            />
            <Input
              label="Accession number"
              name="accessionNumber"
              value={formData.accessionNumber}
              onChange={handleInputChange}
            />
            <Checkbox
              label="Fuzzy Matching"
              name="fuzzyMatching"
              checked={formData.fuzzyMatching}
              onChange={handleInputChange}
            />
            <Input
              label="Issuer of patient"
              name="issuerOfPatient"
              value={formData.issuerOfPatient}
              onChange={handleInputChange}
            />
            <Input
              label="Issuer of accession number"
              name="issuerOfAccessionNumber"
              value={formData.issuerOfAccessionNumber}
              onChange={handleInputChange}
            />
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <Input
              label="Study Description"
              name="studyDescription"
              value={formData.studyDescription}
              onChange={handleInputChange}
            />
            <Select
              label="Modality"
              name="modality"
              value={formData.modality}
              onChange={handleInputChange}
            />
            <Input
              label="Referring physician family"
              name="referringPhysician"
              value={formData.referringPhysician}
              onChange={handleInputChange}
            />
            <Input
              label="Institutional Department Name"
              name="institutionalDepartment"
              value={formData.institutionalDepartment}
              onChange={handleInputChange}
            />
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <Input
              label="Sending AET of Series"
              name="sendingAET"
              value={formData.sendingAET}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study date"
              name="studyDate"
              value={formData.studyDate}
              onChange={handleInputChange}
            />
            <TimeInput
              label="Study time"
              name="studyTime"
              value={formData.studyTime}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study Received"
              name="studyReceived"
              value={formData.studyReceived}
              onChange={handleInputChange}
            />
            <DateInput
              label="Study Access"
              name="studyAccess"
              value={formData.studyAccess}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-6 py-4 border-t">
          <select
            name="orderBy"
            value={formData.orderBy}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="">Order By</option>
            <option value="StudyDate">Study Date</option>
            <option value="PatientName">Patient Name</option>
            <option value="Modality">Modality</option>
          </select>
          <select
            name="webAppService"
            value={formData.webAppService}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded"
          >
            <option value="">Web App Service</option>
            <option value="dcm4chee-arc">DCM4CHEE Archive</option>
            <option value="pacs-service">PACS Service</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={isSearching}
            className="ml-auto bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSearching ? 'SEARCHING...' : 'SUBMIT'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border shadow">
          <div className="px-6 py-3 border-b bg-slate-50">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length} studies found)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Study Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Study Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Modality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Accession #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Series</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Instances</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((study, index) => (
                  <tr
                    key={study.id}
                    className={`border-b hover:bg-slate-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">{study.patientName}</td>
                    <td className="px-4 py-3 text-sm font-mono">{study.patientId}</td>
                    <td className="px-4 py-3 text-sm">{study.studyDate}</td>
                    <td className="px-4 py-3 text-sm">{study.studyTime}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{study.studyDescription}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {study.accessionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{study.numberOfSeries}</td>
                    <td className="px-4 py-3 text-sm text-center">{study.numberOfInstances}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && !isSearching && (
        <div className="bg-white/80 backdrop-blur-md border shadow p-12 text-center text-slate-500">
          <p className="text-lg">No studies found. Use the search form above to find studies.</p>
        </div>
      )}
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function DateInput({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function TimeInput({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="time"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      />
    </label>
  );
}

function Select({ label, name, value, onChange }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-b bg-transparent outline-none focus:border-slate-800 transition"
      >
        <option value="all">All</option>
        <option value="CT">CT</option>
        <option value="MR">MR</option>
        <option value="US">US</option>
        <option value="CR">CR (X-Ray)</option>
        <option value="PT">PT (PET)</option>
        <option value="MG">MG (Mammography)</option>
        <option value="NM">NM (Nuclear Medicine)</option>
      </select>
    </label>
  );
}

function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="cursor-pointer"
      />
      {label}
    </label>
  );
}