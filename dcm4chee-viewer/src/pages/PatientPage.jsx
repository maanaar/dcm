import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import userDB from '../services/userDatabase';
import patientSearch from '../components/patientSearch.jsx';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientFamilyName: '',
    patientId: '',
    issuerOfPatient: '',
    limitOfPatients: '25',
    orderBy: 'PatientName',
    patientSex: '',
    birthDate: '',
    verificationStatus: '',
    webAppService: 'dcm4chee-arc',
    fuzzyMatching: false,
    onlyWithStudies: false,
    mergedPatients: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock search results
    const mockResults = [
      {
        id: '001',
        name: 'John Doe',
        patientId: 'PT12345',
        sex: 'M',
        birthDate: '1985-05-15',
        studies: 12,
        issuer: 'Hospital A'
      },
      {
        id: '002',
        name: 'Jane Smith',
        patientId: 'PT67890',
        sex: 'F',
        birthDate: '1990-08-22',
        studies: 8,
        issuer: 'Hospital B'
      }
    ];
    
    setSearchResults(mockResults);
    setIsSearching(false);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border shadow">
            {/* Header */}
            <div className="flex gap-2 px-6 py-3 border-b">
                <span className="text-2xl text-[rgb(215,160,56)]">✴</span>
                <h2 className="text-2xl font-semibold">Patient Search</h2>
            </div> 
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow p-6">
                <patientSearch />
            </div>     
        
        </div>
           
  );
}