import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import userDB from '../services/userDatabase';

// Sample hospital data
const hospitalData = [
  {
    id: 1,
    name: 'City General Hospital',
    location: 'Downtown, Alexandria',
    type: 'General Hospital',
    beds: 450,
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency'],
    patients: 1250,
    studies: 3400,
    modalities: ['CT', 'MRI', 'X-Ray', 'Ultrasound'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=250&fit=crop'
  },
  {
    id: 2,
    name: 'St. Mary Medical Center',
    location: 'North District, Alexandria',
    type: 'Specialized Center',
    beds: 280,
    departments: ['Oncology', 'Radiology', 'Surgery'],
    patients: 890,
    studies: 2100,
    modalities: ['CT', 'PET-CT', 'MRI'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=250&fit=crop'
  },
  {
    id: 3,
    name: 'Alexandria Children\'s Hospital',
    location: 'West Side, Alexandria',
    type: 'Pediatric Hospital',
    beds: 200,
    departments: ['Pediatrics', 'NICU', 'Pediatric Surgery'],
    patients: 650,
    studies: 1800,
    modalities: ['X-Ray', 'Ultrasound', 'MRI'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&h=250&fit=crop'
  },
  {
    id: 4,
    name: 'Eastern Regional Medical',
    location: 'East Alexandria',
    type: 'Regional Hospital',
    beds: 350,
    departments: ['Emergency', 'ICU', 'General Medicine'],
    patients: 980,
    studies: 2600,
    modalities: ['CT', 'X-Ray', 'Ultrasound', 'Mammography'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&h=250&fit=crop'
  },
  {
    id: 5,
    name: 'Coastal Heart Institute',
    location: 'Waterfront, Alexandria',
    type: 'Cardiac Specialty',
    beds: 150,
    departments: ['Cardiology', 'Cardiac Surgery', 'Interventional'],
    patients: 420,
    studies: 1500,
    modalities: ['CT Angiography', 'Echocardiography', 'Nuclear'],
    status: 'maintenance',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=250&fit=crop'
  },
  {
    id: 6,
    name: 'University Teaching Hospital',
    location: 'University District, Alexandria',
    type: 'Teaching Hospital',
    beds: 550,
    departments: ['All Specialties', 'Research', 'Emergency'],
    patients: 1600,
    studies: 4200,
    modalities: ['CT', 'MRI', 'PET-CT', 'X-Ray', 'Ultrasound', 'Nuclear'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=400&h=250&fit=crop'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState(hospitalData);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // useEffect(() => {
  //   // Check if user is authenticated
  //   if (!userDB.isAuthenticated()) {
  //     navigate('/login');
  //     return;
  //   }
    
  //   const user = userDB.getCurrentUser();
  //   setCurrentUser(user);
  // }, [navigate]);

  // Filter hospitals
  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || hospital.type === filter;
    return matchesSearch && matchesFilter;
  });

  const hospitalTypes = ['all', 'General Hospital', 'Specialized Center', 'Pediatric Hospital', 'Regional Hospital', 'Cardiac Specialty', 'Teaching Hospital'];

  // Calculate statistics
  const totalBeds = hospitals.reduce((sum, h) => sum + h.beds, 0);
  const totalPatients = hospitals.reduce((sum, h) => sum + h.patients, 0);
  const totalStudies = hospitals.reduce((sum, h) => sum + h.studies, 0);
  const activeHospitals = hospitals.filter(h => h.status === 'active').length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-black-800">Hospital Dashboard</h1>
              <p className="text-black-600 mt-2">DICOM Network Management System</p>
              {currentUser && (
                <p className="text-sm text-black-500 mt-1">
                  Welcome, {currentUser.name} ({currentUser.role})
                </p>
              )}
            </div>
            <button
              onClick={() => logout() || navigate('/login')}
              className="px-4 py-2 bg-black-800 text-white rounded-lg hover:bg-black-900 transition"
            >
              Logout
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-black-500">
              <p className="text-sm text-black-600">Total Hospitals</p>
              <p className="text-3xl font-bold text-black-800">{hospitals.length}</p>
              <p className="text-xs text-black-600 mt-1">{activeHospitals} Active</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-black-500">
              <p className="text-sm text-black-600">Total Beds</p>
              <p className="text-3xl font-bold text-black-800">{totalBeds.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-sm text-black-600">Total Patients</p>
              <p className="text-3xl font-bold text-black-800">{totalPatients.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-sm text-black-600">Total Studies</p>
              <p className="text-3xl font-bold text-black-800">{totalStudies.toLocaleString()}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search hospitals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-black-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-black-500"
            >
              {hospitalTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map(hospital => (
            <div
              key={hospital.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/hospital/${hospital.id}`)}
            >
              {/* Hospital Image */}
              <div className="h-48 bg-gradient-to-br from-black-500 to-purple-600 relative overflow-hidden">
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    hospital.status === 'active' 
                      ? 'bg-black-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {hospital.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Hospital Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-black-800 mb-2">{hospital.name}</h3>
                <p className="text-sm text-black-600 mb-1">📍 {hospital.location}</p>
                <p className="text-sm text-black-600 mb-4">{hospital.type}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-black-50 rounded p-2">
                    <p className="text-xs text-black-600">Beds</p>
                    <p className="text-lg font-bold text-black-800">{hospital.beds}</p>
                  </div>
                  <div className="text-center bg-black-50 rounded p-2">
                    <p className="text-xs text-black-600">Patients</p>
                    <p className="text-lg font-bold text-black-800">{hospital.patients}</p>
                  </div>
                  <div className="text-center bg-black-50 rounded p-2">
                    <p className="text-xs text-black-600">Studies</p>
                    <p className="text-lg font-bold text-black-800">{hospital.studies}</p>
                  </div>
                </div>

                {/* Departments */}
                <div className="mb-4">
                  <p className="text-xs text-black-600 mb-2">Departments:</p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.departments.slice(0, 3).map((dept, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-black-100 text-black-800 px-2 py-1 rounded"
                      >
                        {dept}
                      </span>
                    ))}
                    {hospital.departments.length > 3 && (
                      <span className="text-xs bg-black-100 text-black-600 px-2 py-1 rounded">
                        +{hospital.departments.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Modalities */}
                <div>
                  <p className="text-xs text-black-600 mb-2">Modalities:</p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.modalities.map((modality, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
                      >
                        {modality}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full mt-4 bg-black-800 text-white py-2 rounded-lg hover:bg-black-900 transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredHospitals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black-600 text-lg">No hospitals found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}