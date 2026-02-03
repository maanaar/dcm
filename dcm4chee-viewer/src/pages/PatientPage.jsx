import PatientSearch from '../components/patientSearch.jsx';

export default function PatientsPage() {
  
  return (
     <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
      {/* Page header */}
{/*       <h1 className="text-3xl font-semibold mb-4 text-[rgb(45,97,135)]">Patient Search</h1> */}


                <PatientSearch />
    </div>
  );
}